'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  PenTool,
  CheckSquare,
  GripVertical,
} from 'lucide-react';
import {
  RuleConfig,
  RuleCondition,
  RuleAction,
  TriggerType,
  EntityType,
  ActionType,
  ConditionOperator,
  TRIGGER_TYPE_CONFIG,
  ENTITY_TYPE_CONFIG,
  ACTION_TYPE_CONFIG,
  OPERATOR_CONFIG,
} from '@/lib/automation-engine';

interface RuleEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: RuleConfig) => void;
  initialRule?: RuleConfig & { id?: string };
  mode: 'create' | 'edit';
}

export function RuleEditor({
  open,
  onClose,
  onSave,
  initialRule,
  mode,
}: RuleEditorProps) {
  const [loading, setLoading] = useState(false);
  
  // 规则基本信息
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('field_change');
  const [entityType, setEntityType] = useState<EntityType>('opportunity');
  const [isEnabled, setIsEnabled] = useState(true);
  const [priority, setPriority] = useState(0);
  
  // 条件
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  
  // 动作
  const [actions, setActions] = useState<RuleAction[]>([]);

  // 初始化数据
  useEffect(() => {
    if (initialRule) {
      setName(initialRule.name);
      setDescription(initialRule.description || '');
      setTriggerType(initialRule.trigger_type);
      setEntityType(initialRule.entity_type);
      setIsEnabled(initialRule.is_enabled ?? true);
      setPriority(initialRule.priority ?? 0);
      setConditions(initialRule.conditions);
      setActions(initialRule.actions);
    } else {
      resetForm();
    }
  }, [initialRule, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTriggerType('field_change');
    setEntityType('opportunity');
    setIsEnabled(true);
    setPriority(0);
    setConditions([]);
    setActions([]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入规则名称');
      return;
    }
    if (conditions.length === 0) {
      alert('请至少添加一个条件');
      return;
    }
    if (actions.length === 0) {
      alert('请至少添加一个动作');
      return;
    }

    setLoading(true);
    try {
      const rule: RuleConfig = {
        name: name.trim(),
        description: description.trim() || undefined,
        trigger_type: triggerType,
        entity_type: entityType,
        conditions,
        actions,
        is_enabled: isEnabled,
        priority,
      };
      onSave(rule);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // 添加条件
  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: '', operator: 'equals', value: '' },
    ]);
  };

  // 更新条件
  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  // 删除条件
  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // 添加动作
  const addAction = () => {
    setActions([
      ...actions,
      { type: 'create_task', params: {} },
    ]);
  };

  // 更新动作
  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };

  // 删除动作
  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const entityConfig = ENTITY_TYPE_CONFIG[entityType];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '创建自动化规则' : '编辑自动化规则'}
          </DialogTitle>
          <DialogDescription>
            设置规则触发条件和执行动作
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">规则名称 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入规则名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Input
                  id="priority"
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  placeholder="数值越大优先级越高"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="规则描述（可选）"
                rows={2}
              />
            </div>
          </div>

          {/* 触发类型和实体类型 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>触发类型 *</Label>
              <Select
                value={triggerType}
                onValueChange={(value: TriggerType) => setTriggerType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" style={{ color: config.color }} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TRIGGER_TYPE_CONFIG[triggerType].description}
              </p>
            </div>
            <div className="space-y-2">
              <Label>实体类型 *</Label>
              <Select
                value={entityType}
                onValueChange={(value: EntityType) => setEntityType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENTITY_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 条件 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">触发条件</CardTitle>
                  <CardDescription>满足以下所有条件时触发规则</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加条件
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {conditions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无条件，请添加触发条件
                </p>
              ) : (
                conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, { field: value })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="选择字段" />
                      </SelectTrigger>
                      <SelectContent>
                        {entityConfig.fields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(value: ConditionOperator) => updateCondition(index, { operator: value })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPERATOR_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={condition.value as string || ''}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="比较值"
                      className="flex-1"
                      disabled={['is_empty', 'is_not_empty'].includes(condition.operator)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCondition(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 动作 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">执行动作</CardTitle>
                  <CardDescription>规则触发时执行以下动作</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={addAction}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加动作
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无动作，请添加执行动作
                </p>
              ) : (
                actions.map((action, index) => (
                  <ActionEditor
                    key={index}
                    action={action}
                    onChange={(updates) => updateAction(index, updates)}
                    onRemove={() => removeAction(index)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* 启用状态 */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-base">启用规则</Label>
              <p className="text-sm text-muted-foreground">
                禁用后规则将不会触发
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存规则'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 动作编辑器组件
interface ActionEditorProps {
  action: RuleAction;
  onChange: (updates: Partial<RuleAction>) => void;
  onRemove: () => void;
}

function ActionEditor({ action, onChange, onRemove }: ActionEditorProps) {
  const actionConfig = ACTION_TYPE_CONFIG[action.type];
  
  const Icon = action.type === 'create_task' ? CheckSquare :
               action.type === 'send_notification' ? Bell : PenTool;

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${actionConfig.color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: actionConfig.color }} />
          </div>
          <Select
            value={action.type}
            onValueChange={(value: ActionType) => onChange({ type: value, params: {} })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid gap-3">
        {actionConfig.params.map((param) => {
          if (param.type === 'select') {
            const options = (param as { options?: string[] }).options || [];
            return (
              <div key={param.name} className="space-y-1">
                <Label className="text-sm">
                  {param.label} {param.required && '*'}
                </Label>
                <Select
                  value={(action.params[param.name] as string) || ''}
                  onValueChange={(value) => onChange({ 
                    params: { ...action.params, [param.name]: value } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`选择${param.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt: string) => (
                      <SelectItem key={opt} value={opt}>
                        {opt === 'owner' ? '负责人' : 
                         opt === 'manager' ? '经理' : 
                         opt === 'team' ? '团队' : opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          return (
            <div key={param.name} className="space-y-1">
              <Label className="text-sm">
                {param.label} {param.required && '*'}
              </Label>
              <Input
                value={(action.params[param.name] as string) || ''}
                onChange={(e) => onChange({ 
                  params: { ...action.params, [param.name]: e.target.value } 
                })}
                placeholder={`输入${param.label}`}
                type={param.type === 'number' ? 'number' : 'text'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
