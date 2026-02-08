---
title: Proxmox
description: Proxmox Widget Configuration
---

Learn more about [Proxmox](https://www.proxmox.com/en/).

This widget displays comprehensive statistics for your Proxmox Virtual Environment, including:
- Running and total counts of QEMU VMs (excludes templates)
- Running and total counts of LXC Containers
- Online and total cluster node counts
- Optional detailed node list with per-node CPU and memory statistics
- Aggregate CPU and memory usage across the cluster or for a specific node

See the [Proxmox configuration documentation](../../configs/proxmox.md#create-token) for details on creating API tokens.

Use `username@pam!Token ID` as the `username` (e.g `api@pam!homepage`) setting and `Secret` as the `password` setting.

Allowed fields: `["vms", "lxc", "nodes", "node_list", "resources.cpu", "resources.mem"]`.

You can set the optional `node` setting when you want to show metrics for a single node. By default it will show the average for the complete cluster.

```yaml
widget:
  type: proxmox
  url: https://proxmox.host.or.ip:8006
  username: api_token_id
  password: api_token_secret
  node: pve-1 # optional
  fields: ["vms", "lxc", "nodes", "resources.cpu", "resources.mem"] # optional
```

## Field Options

### Basic Fields

- **`vms`** - Displays the count of running VMs vs. total VMs in the format `running/total` (e.g., `5/10`)
  - Automatically excludes VM templates from the count
  - Only counts actual virtual machines

- **`lxc`** - Displays the count of running LXC containers vs. total containers in the format `running/total` (e.g., `3/8`)

- **`nodes`** - Displays the count of online cluster nodes vs. total nodes in the format `online/total` (e.g., `3/3`)
  - Works with both single-server setups (shows `1/1`) and multi-node clusters
  - Provides at-a-glance cluster health status

- **`resources.cpu`** - Displays CPU usage as a percentage across all online cluster nodes (or specific node if configured)
  - Calculated as aggregate CPU usage / total CPU capacity
  - Only includes online nodes in the calculation

- **`resources.mem`** - Displays memory usage as a percentage across all online cluster nodes (or specific node if configured)
  - Calculated as aggregate memory usage / total memory capacity
  - Only includes online nodes in the calculation

### Enhanced Field

- **`node_list`** - Displays a detailed table of all cluster nodes with their current status and resource usage
  - Shows each node with its online/offline status and individual CPU/MEM percentages
  - **Visual indicators:**
    - **Green filled dot (●)** = Node is online
    - **Red hollow dot (○)** = Node is offline
  - **Per-node statistics:**
    - Individual CPU percentage for each online node
    - Individual memory percentage for each online node
    - Em dash (—) displayed for offline nodes instead of percentages
  - Offline nodes are displayed with grayed-out text
  - Particularly useful for multi-node clusters to quickly identify which nodes are under load or down
  - Also works with single-node setups (displays one node with status)

## Configuration Examples

### Example 1: Basic Cluster View
Shows essential statistics across all nodes in the cluster:

```yaml
widget:
  type: proxmox
  url: https://proxmox.host.or.ip:8006
  username: api@pam!homepage
  password: api_token_secret
  fields: ["vms", "lxc", "nodes", "resources.cpu", "resources.mem"]
```

**Display output:**
```
VMs: 15/20
LXC: 5/8
Nodes: 3/3
CPU: 45%
MEM: 62%
```

### Example 2: Enhanced Cluster View with Node List
Shows cluster statistics plus a detailed table of all nodes with per-node resource usage:

```yaml
widget:
  type: proxmox
  url: https://proxmox.host.or.ip:8006
  username: api@pam!homepage
  password: api_token_secret
  fields: ["vms", "lxc", "nodes", "node_list", "resources.cpu", "resources.mem"]
```

**Display output:**
```
VMs: 15/20
LXC: 5/8
Nodes: 3/3
CPU: 45%
MEM: 62%

Node             CPU   MEM
───────────────────────────
● pve-node-1      5%   45%
● pve-node-2      8%   51%
● pve-node-3     15%   58%
```

If a node is offline, it will appear as:
```
Node             CPU   MEM
───────────────────────────
● pve-node-1      5%   45%
○ pve-node-2      —    —
● pve-node-3     15%   58%
```

The offline node (pve-node-2) displays:
- Red hollow dot (○) to indicate offline status
- Grayed-out node name
- Em dashes (—) instead of resource percentages
- Does not contribute to aggregate CPU/MEM calculations at the top

### Example 3: Single Node View
Shows statistics for a specific node only (useful in multi-node clusters to monitor individual nodes):

```yaml
widget:
  type: proxmox
  url: https://proxmox.host.or.ip:8006
  username: api@pam!homepage
  password: api_token_secret
  node: pve-1
  fields: ["vms", "lxc", "resources.cpu", "resources.mem"]
```

**Display output:**
```
VMs: 5/7      (only VMs on pve-1)
LXC: 2/3      (only LXCs on pve-1)
CPU: 23%      (only pve-1 usage)
MEM: 45%      (only pve-1 usage)
```

**Note:** When using the `node` parameter, you can still include the `nodes` field which will show the total cluster node count, but CPU and memory statistics will be limited to the specified node only.

### Example 4: Minimal Space-Saving View
Shows only the most critical information:

```yaml
widget:
  type: proxmox
  url: https://proxmox.host.or.ip:8006
  username: api@pam!homepage
  password: api_token_secret
  fields: ["vms", "lxc", "nodes"]
```

**Display output:**
```
VMs: 15/20
LXC: 5/8
Nodes: 3/3
```

## Single Server vs. Cluster Behavior

The widget works seamlessly with both single Proxmox servers and multi-node clusters:

### Single Server Setup
For a standalone Proxmox server (no cluster):
- **`nodes` field** displays `1/1` when the server is online, or `0/1` if offline
- **`node_list` field** displays a single node with its CPU and memory usage
- CPU and memory show usage for that single server
- All VM and LXC counts work normally

**Example display for single server:**
```
VMs: 5/10
LXC: 2/5
Nodes: 1/1      ← Single server
CPU: 45%
MEM: 62%

Node             CPU   MEM
───────────────────────────
● pve             45%   62%
```

### Multi-Node Cluster Setup
For a Proxmox cluster with multiple nodes:
- **`nodes` field** displays online count vs. total (e.g., `3/3` or `2/3` if one is down)
- **`node_list` field** displays all nodes with individual CPU/MEM percentages
- Aggregate CPU and memory show usage across all online nodes only
- VM and LXC counts include resources from all nodes

**Example display for 3-node cluster:**
```
VMs: 15/20     ← Total across all nodes
LXC: 5/8       ← Total across all nodes
Nodes: 3/3     ← Cluster health (all online)
CPU: 45%       ← Average across online nodes
MEM: 62%       ← Average across online nodes

Node             CPU   MEM
───────────────────────────
● pve-1           5%   45%
● pve-2           8%   51%
● pve-3          15%   58%
```

**Example with one offline node:**
```
VMs: 12/18     ← Total from online nodes only
LXC: 4/7       ← Total from online nodes only
Nodes: 2/3     ← Cluster health (2 of 3 online)
CPU: 38%       ← Average of online nodes only
MEM: 55%       ← Average of online nodes only

Node             CPU   MEM
───────────────────────────
● pve-1           5%   45%
○ pve-2           —    —
● pve-3          15%   58%
```

## Important Notes

### VM Templates
The widget automatically excludes VM templates from the VM count. Templates (identified by `template: 1` in the Proxmox API) are not counted as VMs, ensuring accurate counts that match what you see in the Proxmox web interface.

### Offline Node Handling
When nodes are offline:
- They are **not included** in aggregate CPU and memory calculations
- They display with a red hollow dot (○) in the node list
- Their CPU and memory show em dash (—) instead of percentages
- Their node names appear grayed out
- They **are still counted** in the total node count (e.g., "2/3" means 2 online out of 3 total)

### Node Field Behavior
- The `nodes` field shows cluster-wide node status regardless of the `node` parameter
- When `node` parameter is set, only CPU, memory, VM, and LXC counts are filtered to that specific node
- The `node_list` field always shows all nodes in the cluster with their individual statistics, even when the `node` parameter is set

### Resource Calculations
- **Aggregate CPU percentage:** (Total CPU usage across online nodes / Total CPU capacity of online nodes) × 100
- **Aggregate Memory percentage:** (Total memory usage across online nodes / Total memory capacity of online nodes) × 100
- **Per-node CPU percentage:** (Node CPU usage / Node CPU capacity) × 100
- **Per-node Memory percentage:** (Node memory usage / Node memory capacity) × 100
- Offline nodes do not contribute to aggregate calculations

### Node List Display
The node list is displayed in a two-column grid format below the main statistics:
- Left column: Node name with status indicator
- Right columns: CPU and MEM percentages (fixed-width, right-aligned)
- Columns are labeled with headers: "Node", "CPU", "MEM"
- Section header "Node" appears above the table
- Percentages use monospace font for clean alignment

### API Permissions
The widget requires a Proxmox API token with the `PVEAuditor` role assigned at the `/` path with the "Propagate" option enabled. See the [Proxmox configuration documentation](../../configs/proxmox.md#create-token) for detailed setup instructions.

## Translation Keys

If you're adding translations for this widget, the following keys are used:

```json
{
  "proxmox": {
    "vms": "VMs",
    "lxc": "LXC",
    "nodes": "Nodes"
  }
}
```

The node list section uses hardcoded English text ("Node", "CPU", "MEM") which may be localized in future versions.
