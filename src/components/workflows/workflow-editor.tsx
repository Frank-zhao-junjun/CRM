'use client';

import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  Save,
  Zap,
  Clock,
  GitBranch,
  Mail,
  Bell,
  Database,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

// 节点类型定义
interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  actionType?: string;
  config: Record<string, string | number | boolean>;
}

// 节点配置
const NODE_TEMPLATES: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  items: Array<{ type: string; label: string; icon: React.ElementType; config: Record<string, string | number> }>;
}> = {
  trigger: {
    label: '触发器',
    icon: Zap,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    items: [
      { type: 'schedule', label: '定时触发', icon: Clock, config: { cron: '0 9 * * *' } },
      { type: 'event', label: '事件触发', icon: Zap, config: { event: 'opportunity.created' } },
    ],
  },
  action: {
    label: '动作',
    icon: Play,
    color: 'bg-blue-100 border-blue-300 text-blue-700',
    items: [
      { type: 'send_email', label: '发送邮件', icon: Mail, config: { to: '', subject: '', body: '', actionType: 'send_email' } },
      { type: 'send_notification', label: '发送通知', icon: Bell, config: { message: '', actionType: 'send_notification' } },
      { type: 'create_task', label: '创建任务', icon: Bell, config: { title: '', assignee: '', actionType: 'create_task' } },
      { type: 'update_field', label: '更新字段', icon: Database, config: { entity: '', field: '', value: '', actionType: 'update_field' } },
    ],
  },
  condition: {
    label: '条件判断',
    icon: GitBranch,
    color: 'bg-purple-100 border-purple-300 text-purple-700',
    items: [
      { type: 'if', label: '条件分支', icon: GitBranch, config: { field: '', operator: 'equals', value: '' } },
    ],
  },
  delay: {
    label: '延时',
    icon: Clock,
    color: 'bg-gray-100 border-gray-300 text-gray-700',
    items: [
      { type: 'wait', label: '等待', icon: Clock, config: { minutes: 0 } },
    ],
  },
};

// 自定义节点组件
function TriggerNode({ data }: { data: WorkflowNodeData }) {
  const template = NODE_TEMPLATES.trigger;
  const config = data.config || {};
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${template.color} min-w-[150px]`}>
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        <span className="font-medium">{data.label}</span>
      </div>
      {config.event && (
        <div className="text-xs mt-1 opacity-75">{String(config.event)}</div>
      )}
      {config.cron && (
        <div className="text-xs mt-1 opacity-75">{String(config.cron)}</div>
      )}
    </div>
  );
}

function ActionNode({ data }: { data: WorkflowNodeData }) {
  const template = NODE_TEMPLATES.action;
  const config = data.config || {};
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${template.color} min-w-[150px]`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4" />
        <span className="font-medium">{data.label}</span>
      </div>
      {config.message && (
        <div className="text-xs mt-1 opacity-75 truncate max-w-[120px]">{String(config.message)}</div>
      )}
    </div>
  );
}

function ConditionNode({ data }: { data: WorkflowNodeData }) {
  const template = NODE_TEMPLATES.condition;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${template.color} min-w-[150px]`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-green-400" id="yes" />
      <Handle type="source" position={Position.Bottom} className="!bg-red-400" id="no" />
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        <span className="font-medium">{data.label}</span>
      </div>
      <div className="flex gap-1 mt-1">
        <Badge variant="outline" className="text-xs bg-green-50">是</Badge>
        <Badge variant="outline" className="text-xs bg-red-50">否</Badge>
      </div>
    </div>
  );
}

function DelayNode({ data }: { data: WorkflowNodeData }) {
  const template = NODE_TEMPLATES.delay;
  const config = data.config || {};
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${template.color} min-w-[150px]`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="font-medium">{data.label}</span>
      </div>
      {config.minutes !== undefined && (
        <div className="text-xs mt-1 opacity-75">等待 {String(config.minutes)} 分钟</div>
      )}
    </div>
  );
}

// 节点类型映射
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};

// 属性面板配置
const TRIGGER_CONFIG_FIELDS: Record<string, Array<{ label: string; type: string; placeholder?: string; configKey: string }>> = {
  schedule: [
    { label: 'Cron 表达式', type: 'input', placeholder: '0 9 * * *', configKey: 'cron' },
    { label: '描述', type: 'input', placeholder: '每天早上9点执行', configKey: 'description' },
  ],
  event: [
    { label: '事件名称', type: 'input', placeholder: 'opportunity.created', configKey: 'event' },
    { label: '描述', type: 'input', placeholder: '当商机创建时触发', configKey: 'description' },
  ],
};

const ACTION_CONFIG_FIELDS: Record<string, Array<{ label: string; type: string; placeholder?: string; configKey: string }>> = {
  send_email: [
    { label: '收件人', type: 'input', placeholder: '{{customer.email}}', configKey: 'to' },
    { label: '主题', type: 'input', placeholder: '邮件主题', configKey: 'subject' },
    { label: '内容', type: 'textarea', placeholder: '邮件内容', configKey: 'body' },
  ],
  send_notification: [
    { label: '通知内容', type: 'textarea', placeholder: '通知内容', configKey: 'message' },
  ],
  create_task: [
    { label: '任务标题', type: 'input', placeholder: '任务标题', configKey: 'title' },
    { label: '分配给', type: 'input', placeholder: '负责人', configKey: 'assignee' },
  ],
  update_field: [
    { label: '实体类型', type: 'input', placeholder: 'opportunity', configKey: 'entity' },
    { label: '字段名', type: 'input', placeholder: 'status', configKey: 'field' },
    { label: '字段值', type: 'input', placeholder: 'closed_won', configKey: 'value' },
  ],
};

interface WorkflowEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (workflow: {
    name: string;
    description: string;
    triggerType: string;
    triggerConfig: Record<string, string>;
    nodes: Node[];
    edges: Edge[];
  }) => void;
  initialData?: {
    id?: string;
    name: string;
    description: string;
    triggerType: string;
    triggerConfig: Record<string, string>;
    nodes: Node[];
    edges: Edge[];
  };
  mode: 'create' | 'edit';
}

export function WorkflowEditor({ open, onClose, onSave, initialData, mode }: WorkflowEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('manual');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>({});
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'config'>('canvas');
  const [saving, setSaving] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setTriggerType(initialData.triggerType);
      setTriggerConfig(initialData.triggerConfig);
      setNodes(initialData.nodes);
      setEdges(initialData.edges);
    } else {
      setName('');
      setDescription('');
      setTriggerType('manual');
      setTriggerConfig({});
      setNodes([]);
      setEdges([]);
    }
  }, [initialData, setNodes, setEdges]);

  // 连接处理
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  // 添加节点
  const addNode = (type: string, nodeType: string, template: { label: string; config: Record<string, string | number> }) => {
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 },
      data: {
        label: template.label,
        nodeType,
        actionType: type,
        config: { ...template.config },
      } as WorkflowNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // 删除节点
  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  // 更新节点配置
  const updateNodeConfig = (nodeId: string, configKey: string, configValue: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const nodeData = n.data as WorkflowNodeData;
        return {
          ...n,
          data: {
            ...nodeData,
            config: { ...nodeData.config, [configKey]: configValue },
          },
        };
      })
    );
    if (selectedNode) {
      const nodeData = selectedNode.data as WorkflowNodeData;
      setSelectedNode({
        ...selectedNode,
        data: {
          ...nodeData,
          config: { ...nodeData.config, [configKey]: configValue },
        },
      });
    }
  };

  // 保存工作流
  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入工作流名称');
      return;
    }
    
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        triggerType,
        triggerConfig,
        nodes,
        edges,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // 获取触发配置字段
  const getTriggerFields = () => {
    return TRIGGER_CONFIG_FIELDS[triggerType] || [];
  };

  // 获取动作配置字段
  const getActionFields = (actionType: string) => {
    return ACTION_CONFIG_FIELDS[actionType] || [];
  };

  // 获取节点配置中的 actionType
  const getNodeActionType = () => {
    const data = selectedNode?.data as WorkflowNodeData | undefined;
    return data?.actionType || '';
  };

  // 获取节点数据
  const getNodeData = () => {
    return selectedNode?.data as WorkflowNodeData | undefined;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '创建工作流' : '编辑工作流'}</DialogTitle>
          <DialogDescription>使用可视化编辑器设计自动化工作流</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* 左侧配置面板 */}
          <div className="w-[300px] flex flex-col gap-4 overflow-y-auto">
            {/* 基本信息 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">名称</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="工作流名称"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="工作流描述（可选）"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 触发器配置 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  触发器
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={triggerType} onValueChange={(v) => {
                  setTriggerType(v);
                  setTriggerConfig({});
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择触发类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">手动触发</SelectItem>
                    <SelectItem value="schedule">定时执行</SelectItem>
                    <SelectItem value="event">事件触发</SelectItem>
                  </SelectContent>
                </Select>
                
                {triggerType !== 'manual' && getTriggerFields().map((field) => (
                  <div key={field.configKey} className="space-y-1">
                    <Label className="text-xs">{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={triggerConfig[field.configKey] || ''}
                        onChange={(e) => setTriggerConfig({
                          ...triggerConfig,
                          [field.configKey]: e.target.value,
                        })}
                        placeholder={field.placeholder}
                        rows={2}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        value={triggerConfig[field.configKey] || ''}
                        onChange={(e) => setTriggerConfig({
                          ...triggerConfig,
                          [field.configKey]: e.target.value,
                        })}
                        placeholder={field.placeholder}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 节点库 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">节点库</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(NODE_TEMPLATES).filter(([key]) => key !== 'trigger').map(([key, template]) => (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-2">
                      {React.createElement(template.icon, { className: 'h-4 w-4' })}
                      <span className="text-sm font-medium">{template.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {template.items.map((item) => (
                        <Button
                          key={item.type}
                          variant="outline"
                          size="sm"
                          className="justify-start text-xs h-auto py-2"
                          onClick={() => addNode(item.type, key, item)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 右侧画布 */}
          <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'canvas' | 'config')}>
              <div className="px-4 border-b bg-muted/50">
                <TabsList>
                  <TabsTrigger value="canvas">画布</TabsTrigger>
                  <TabsTrigger value="config" disabled={!selectedNode}>节点配置</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="canvas" className="flex-1 m-0">
                <div className="h-full">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => {
                      setSelectedNode(node);
                      setActiveTab('config');
                    }}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-50"
                  >
                    <Controls />
                    <MiniMap />
                    <Background />
                  </ReactFlow>
                </div>
              </TabsContent>
              
              <TabsContent value="config" className="p-4">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge>{selectedNode.type}</Badge>
                        <span className="font-medium">{getNodeData()?.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => deleteNode(selectedNode.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {getNodeData()?.nodeType === 'action' && (
                      <div className="space-y-3">
                        {getActionFields(getNodeActionType()).map((field) => (
                          <div key={field.configKey} className="space-y-1">
                            <Label className="text-xs">{field.label}</Label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                value={String(getNodeData()?.config?.[field.configKey] || '')}
                                onChange={(e) => updateNodeConfig(
                                  selectedNode.id,
                                  field.configKey,
                                  e.target.value
                                )}
                                placeholder={field.placeholder}
                                rows={3}
                                className="text-sm"
                              />
                            ) : (
                              <Input
                                value={String(getNodeData()?.config?.[field.configKey] || '')}
                                onChange={(e) => updateNodeConfig(
                                  selectedNode.id,
                                  field.configKey,
                                  e.target.value
                                )}
                                placeholder={field.placeholder}
                                className="text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    选择一个节点进行配置
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存工作流
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 重新导出 WorkflowTemplate 类型
export type { WorkflowTemplate } from './template-selector';
