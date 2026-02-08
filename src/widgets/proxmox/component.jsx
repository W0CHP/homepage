import { useTranslation } from "next-i18next";

import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget } = service;

  const { data: proxmoxData, error: proxmoxError } = useWidgetAPI(widget, "resources");

  if (proxmoxError) {
    return <Container service={service} error={proxmoxError} />;
  }

  if (!proxmoxData) {
    return (
      <Container service={service}>
        <Block label="proxmox.vms" />
        <Block label="proxmox.lxc" />
        <Block label="proxmox.nodes" />
        <Block label="resources.cpu" />
        <Block label="resources.mem" />
      </Container>
    );
  }

  try {
    const resources = proxmoxData.data || [];
    const specificNode = widget.node;

    let vmsRunning = 0;
    let vmsTotal = 0;
    let lxcRunning = 0;
    let lxcTotal = 0;
    let nodesOnline = 0;
    let nodesTotal = 0;
    let totalCpu = 0;
    let maxCpu = 0;
    let totalMem = 0;
    let maxMem = 0;

    const nodeDetails = [];

    resources.forEach((resource) => {
      const { type, status, node, cpu, maxcpu, mem, maxmem, template } = resource;

      if (type === "node") {
        nodesTotal += 1;
        const isOnline = status === "online";

        if (isOnline) {
          nodesOnline += 1;
        }


        const nodeCpuPercent = isOnline && maxcpu > 0 ? Math.round((cpu / maxcpu) * 100) : null;
        const nodeMemPercent = isOnline && maxmem > 0 ? Math.round((mem / maxmem) * 100) : null;


        nodeDetails.push({
          node: node,
          status: status,
          cpu: nodeCpuPercent,
          mem: nodeMemPercent,
          isOnline: isOnline,
        });


        if (isOnline && (!specificNode || node === specificNode)) {
          totalCpu += cpu || 0;
          maxCpu += maxcpu || 0;
          totalMem += mem || 0;
          maxMem += maxmem || 0;
        }
      }


      if (type === "qemu" && !template) {
        if (!specificNode || node === specificNode) {
          vmsTotal += 1;
          if (status === "running") {
            vmsRunning += 1;
          }
        }
      }


      if (type === "lxc") {
        if (!specificNode || node === specificNode) {
          lxcTotal += 1;
          if (status === "running") {
            lxcRunning += 1;
          }
        }
      }
    });


    const cpuPercent = maxCpu > 0 ? Math.round((totalCpu / maxCpu) * 100) : 0;
    const memPercent = maxMem > 0 ? Math.round((totalMem / maxMem) * 100) : 0;


    const showNodeList = widget.fields?.includes("node_list");

    return (
      <>
        <Container service={service}>
          <Block label="proxmox.vms" value={`${vmsRunning}/${vmsTotal}`} />
          <Block label="proxmox.lxc" value={`${lxcRunning}/${lxcTotal}`} />
          <Block label="proxmox.nodes" value={`${nodesOnline}/${nodesTotal}`} />
          <Block label="resources.cpu" value={t("common.percent", { value: cpuPercent })} />
          <Block label="resources.mem" value={t("common.percent", { value: memPercent })} />
        </Container>

        {showNodeList && nodeDetails.length > 0 && (
          <div className="px-3 py-2 mt-1 text-xs">

            <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-theme-200 dark:border-theme-700">
              <div className="flex-1 text-theme-600 dark:text-theme-400 text-xs">
                Node
              </div>
              <div className="flex gap-3 text-xs">
                <span className="w-8 text-right">CPU</span>
                <span className="w-8 text-right">MEM</span>
              </div>
            </div>

            <div className="space-y-0.5">
              {nodeDetails.map((nodeInfo) => (
                <div key={nodeInfo.node} className="flex items-center justify-between gap-20">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={nodeInfo.isOnline ? "text-green-500" : "text-red-500"}>
                      {nodeInfo.isOnline ? "●" : "○"}
                    </span>
                    <span className={`text-xs truncate ${!nodeInfo.isOnline ? "" : ""}`}>
                      {nodeInfo.node}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="font-mono w-8 text-right">
                      {nodeInfo.cpu !== null ? `${nodeInfo.cpu}%` : "—"}
                    </span>
                    <span className="font-mono w-8 text-right">
                      {nodeInfo.mem !== null ? `${nodeInfo.mem}%` : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  } catch (e) {
    return <Container service={service} error={{ message: `Error parsing data: ${e.message}` }} />;
  }
}
