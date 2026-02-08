---
title: Proxmox
description: Proxmox Widget Configuration
---

Learn more about [Proxmox](https://www.proxmox.com/en/).

This widget displays comprehensive statistics for your Proxmox Virtual Environment, including:
- Running and total counts of QEMU VMs (excludes templates)
- Running and total counts of LXC Containers
- Online and total cluster node counts
- Optional detailed node list with visual status indicators
- CPU and memory usage across the cluster or for a specific node

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
  
- **`resources.cpu`** - Displays CPU usage as a percentage across all cluster nodes (or specific node if configured)
  - Calculated as aggregate CPU usage / total CPU capacity
  
- **`resources.mem`** - Displays memory usage as a percentage across all cluster nodes (or specific node if configured)
  - Calculated as aggregate memory usage / total memory capacity

### Enhanced Field

- **`node_list`** - Displays a detailed visual list of all cluster nodes with their current status
  - Shows each node name with real-time status
  - **Visual indicators:**
    - **Green dot (●)** = Node is online
    - **Red dot (○)** = Node is offline
    - **Green checkmark (✓)** = Node is online
    - **Red X (✗)** = Node is offline
  - Requires the `nodes` field to also be present in the fields array
  - Particularly useful for multi-node clusters to quickly identify which nodes are down
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
Shows cluster statistics plus a detailed list of all nodes with visual status indicators:

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

Cluster Nodes:
● pve-node-1        ✓
● pve-node-2        ✓
● pve-node-3        ✓
```

If a node is offline, it will appear as:
```
Cluster Nodes:
● pve-node-1        ✓
○ pve-node-2        ✗
● pve-node-3        ✓
```

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
- **`node_list` field** displays a single node with its status
- CPU and memory show usage for that single server
- All VM and LXC counts work normally

**Example display for single server:**
```
VMs: 5/10
LXC: 2/5
Nodes: 1/1      ← Single server
CPU: 45%
MEM: 62%
```

### Multi-Node Cluster Setup
For a Proxmox cluster with multiple nodes:
- **`nodes` field** displays online count vs. total (e.g., `3/3` or `2/3` if one is down)
- **`node_list` field** displays all nodes with individual status indicators
- CPU and memory show aggregate usage across all online nodes
- VM and LXC counts include resources from all nodes

**Example display for 3-node cluster:**
```
VMs: 15/20     ← Total across all nodes
LXC: 5/8       ← Total across all nodes
Nodes: 3/3     ← Cluster health
CPU: 45%       ← Average across cluster
MEM: 62%       ← Average across cluster
```

## Important Notes

### VM Templates
The widget automatically excludes VM templates from the VM count. Templates are not counted as VMs, ensuring accurate counts that match what you see in the Proxmox web interface.

### Node Field Behavior
- The `nodes` field shows cluster-wide node status regardless of the `node` parameter
- When `node` parameter is set, only CPU, memory, VM, and LXC counts are filtered to that specific node
- The `node_list` field always shows all nodes in the cluster, even when the `node` parameter is set

### Resource Calculations
- **CPU percentage:** (Total CPU usage across selected nodes / Total CPU capacity) × 100
- **Memory percentage:** (Total memory usage across selected nodes / Total memory capacity) × 100
- Calculations automatically adjust whether you're viewing cluster-wide or single-node statistics

### API Permissions
The widget requires a Proxmox API token with the `PVEAuditor` role assigned at the `/` path with the "Propagate" option enabled. See the [Proxmox configuration documentation](../../configs/proxmox.md#create-token) for detailed setup instructions.
