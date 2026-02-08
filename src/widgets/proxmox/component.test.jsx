// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "test-utils/render-with-providers";
import { findServiceBlockByLabel } from "test-utils/widget-assertions";

const { useWidgetAPI } = vi.hoisted(() => ({ useWidgetAPI: vi.fn() }));
vi.mock("utils/proxy/use-widget-api", () => ({ default: useWidgetAPI }));

import Component from "./component";

function expectBlockValue(container, label, value) {
  const block = findServiceBlockByLabel(container, label);
  expect(block, `missing block for ${label}`).toBeTruthy();
  expect(block.textContent).toContain(String(value));
}

describe("widgets/proxmox/component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders placeholders while loading", () => {
    useWidgetAPI.mockReturnValue({ data: undefined, error: undefined });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "proxmox" } }} />, {
      settings: { hideErrors: false },
    });

    expect(container.querySelectorAll(".service-block")).toHaveLength(5);
    expect(screen.getByText("proxmox.vms")).toBeInTheDocument();
    expect(screen.getByText("proxmox.lxc")).toBeInTheDocument();
    expect(screen.getByText("proxmox.nodes")).toBeInTheDocument();
    expect(screen.getByText("resources.cpu")).toBeInTheDocument();
    expect(screen.getByText("resources.mem")).toBeInTheDocument();
  });

  it("renders VM/LXC/node totals and aggregated cpu/mem when nodes are present", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        data: [
          { type: "qemu", template: 0, node: "n1", status: "running" },
          { type: "qemu", template: 0, node: "n1", status: "stopped" },
          { type: "lxc", template: 0, node: "n1", status: "running" },
          { type: "node", node: "n1", status: "online", maxmem: 100, mem: 50, maxcpu: 4, cpu: 0.25 },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "proxmox" } }} />, {
      settings: { hideErrors: false },
    });

    expectBlockValue(container, "proxmox.vms", "1 / 2");
    expectBlockValue(container, "proxmox.lxc", "1 / 1");
    expectBlockValue(container, "proxmox.nodes", "1 / 1");
    // cpu% = (usedCpu / maxCpu)*100 = ((0.25*4)/4)*100 = 25
    expectBlockValue(container, "resources.cpu", 25);
    // mem% = (50/100)*100 = 50
    expectBlockValue(container, "resources.mem", 50);
  });

  it("excludes VM templates from VM count", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        data: [
          { type: "qemu", template: 0, node: "n1", status: "running" },
          { type: "qemu", template: 0, node: "n1", status: "stopped" },
          { type: "qemu", template: 1, node: "n1", status: "stopped" }, // Template - should be excluded
          { type: "qemu", template: 1, node: "n1", status: "stopped" }, // Another template
          { type: "node", node: "n1", status: "online", maxmem: 100, mem: 50, maxcpu: 4, cpu: 0.25 },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "proxmox" } }} />, {
      settings: { hideErrors: false },
    });

    // Should only count 2 VMs, not 4 (templates excluded)
    expectBlockValue(container, "proxmox.vms", "1 / 2");
  });

  it("counts multiple nodes correctly", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        data: [
          { type: "qemu", template: 0, node: "n1", status: "running" },
          { type: "qemu", template: 0, node: "n2", status: "running" },
          { type: "lxc", template: 0, node: "n1", status: "running" },
          { type: "node", node: "n1", status: "online", maxmem: 100, mem: 50, maxcpu: 4, cpu: 0.25 },
          { type: "node", node: "n2", status: "online", maxmem: 100, mem: 30, maxcpu: 4, cpu: 0.5 },
          { type: "node", node: "n3", status: "offline", maxmem: 100, mem: 0, maxcpu: 4, cpu: 0 },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "proxmox" } }} />, {
      settings: { hideErrors: false },
    });

    expectBlockValue(container, "proxmox.vms", "2 / 2");
    expectBlockValue(container, "proxmox.lxc", "1 / 1");
    expectBlockValue(container, "proxmox.nodes", "2 / 3"); // 2 online out of 3 total
    // cpu% = ((0.25 + 0.5) / 8) * 100 = 9.375 rounded to 9
    expectBlockValue(container, "resources.cpu", 9);
    // mem% = ((50 + 30) / 200) * 100 = 40
    expectBlockValue(container, "resources.mem", 40);
  });

  it("filters VMs/LXCs by specific node when node parameter is set", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        data: [
          { type: "qemu", template: 0, node: "n1", status: "running" },
          { type: "qemu", template: 0, node: "n2", status: "running" },
          { type: "qemu", template: 0, node: "n2", status: "stopped" },
          { type: "lxc", template: 0, node: "n1", status: "running" },
          { type: "lxc", template: 0, node: "n2", status: "running" },
          { type: "node", node: "n1", status: "online", maxmem: 100, mem: 50, maxcpu: 4, cpu: 0.25 },
          { type: "node", node: "n2", status: "online", maxmem: 100, mem: 30, maxcpu: 4, cpu: 0.5 },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "proxmox", node: "n2" } }} />,
      {
        settings: { hideErrors: false },
      }
    );

    // Should only count VMs and LXCs on n2
    expectBlockValue(container, "proxmox.vms", "1 / 2"); // 1 running, 2 total on n2
    expectBlockValue(container, "proxmox.lxc", "1 / 1"); // 1 running on n2
    expectBlockValue(container, "proxmox.nodes", "2 / 2"); // Node count is still cluster-wide
    // cpu% should only be from n2: (0.5 / 4) * 100 = 12.5 rounded to 13
    expectBlockValue(container, "resources.cpu", 13);
    // mem% should only be from n2: (30 / 100) * 100 = 30
    expectBlockValue(container, "resources.mem", 30);
  });

  it("renders node list when node_list field is included", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        data: [
          { type: "qemu", template: 0, node: "n1", status: "running" },
          { type: "node", node: "n1", status: "online", maxmem: 100, mem: 50, maxcpu: 4, cpu: 0.25 },
          { type: "node", node: "n2", status: "online", maxmem: 100, mem: 30, maxcpu: 4, cpu: 0.5 },
          { type: "node", node: "n3", status: "offline", maxmem: 100, mem: 0, maxcpu: 4, cpu: 0 },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "proxmox", fields: ["vms", "nodes", "node_list"] } }} />,
      {
        settings: { hideErrors: false },
      }
    );

    // Check that node list section is rendered
    expect(screen.getByText("Nodes:")).toBeInTheDocument();
    expect(screen.getByText("Node")).toBeInTheDocument();
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("MEM")).toBeInTheDocument();

    // Check that all nodes are listed
    expect(screen.getByText("n1")).toBeInTheDocument();
    expect(screen.getByText("n2")).toBeInTheDocument();
    expect(screen.getByText("n3")).toBeInTheDocument();

    // Check that percentages are shown for online nodes
    expect(container.textContent).toContain("25%"); // n1 cpu
    expect(container.textContent).toContain("50%"); // n1 mem
    expect(container.textContent).toContain("13%"); // n2 cpu (0.5/4 = 12.5 rounded to 13)
    expect(container.textContent).toContain("30%"); // n2 mem
  });

  it("shows em dash for offline nodes in node list", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        data: [
          { type: "node", node: "n1", status: "online", maxmem: 100, mem: 50, maxcpu: 4, cpu: 0.25 },
          { type: "node", node: "n2", status: "offline", maxmem: 100, mem: 0, maxcpu: 4, cpu: 0 },
        ],
      },
      error: undefined,
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "proxmox", fields: ["nodes", "node_list"] } }} />,
      {
        settings: { hideErrors: false },
      }
    );

    expect(screen.getByText("n1")).toBeInTheDocument();
    expect(screen.getByText("n2")).toBeInTheDocument();

    // Online node should have percentages
    expect(container.textContent).toContain("25%");
    expect(container.textContent).toContain("50%");

    // Offline node should have em dashes (—)
    const textContent = container.textContent;
    const n2Section = textContent.substring(textContent.indexOf("n2"));
    expect(n2Section).toContain("—");
  });

  it("does not render node list when node_list field is not included", () => {
    useWidgetAPI.mockReturnValue({
      data: {
        data: [
          { type: "node", node: "n1", status: "online", maxmem: 100, mem: 50, maxcpu: 4, cpu: 0.25 },
          { type: "node", node: "n2", status: "online", maxmem: 100, mem: 30, maxcpu: 4, cpu: 0.5 },
        ],
      },
      error: undefined,
    });

    renderWithProviders(
      <Component service={{ widget: { type: "proxmox", fields: ["vms", "nodes"] } }} />,
      {
        settings: { hideErrors: false },
      }
    );

    // Node list section should not be rendered
    expect(screen.queryByText("Nodes:")).not.toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    useWidgetAPI.mockReturnValue({
      data: { data: [] },
      error: undefined,
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "proxmox" } }} />, {
      settings: { hideErrors: false },
    });

    expectBlockValue(container, "proxmox.vms", "0 / 0");
    expectBlockValue(container, "proxmox.lxc", "0 / 0");
    expectBlockValue(container, "proxmox.nodes", "0 / 0");
    expectBlockValue(container, "resources.cpu", 0);
    expectBlockValue(container, "resources.mem", 0);
  });
});
