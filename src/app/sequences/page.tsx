'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SequenceCard } from '@/components/sequences/SequenceCard';
import { Plus, Mail, ListTodo, Clock, ArrowRight, Trash2, GripVertical } from 'lucide-react';
import type { Sequence, SequenceStep } from '@/lib/sequences';
import { sequenceAPI } from '@/lib/sequences';

interface SequenceEditorProps {
  sequence?: Sequence | null;
  onSave: (data: Partial<Sequence>) => void;
  onCancel: () => void;
}

function SequenceEditor({ sequence, onSave, onCancel }: SequenceEditorProps) {
  const [name, setName] = useState(sequence?.name || '');
  const [description, setDescription] = useState(sequence?.description || '');
  const [targetType, setTargetType] = useState<'lead' | 'opportunity' | 'customer'>(sequence?.targetType || 'lead');
  const [steps, setSteps] = useState<SequenceStep[]>(sequence?.steps || []);

  const addStep = (type: 'email' | 'task' | 'delay') => {
    const newStep: SequenceStep = {
      id: `step-${Date.now()}`,
      type,
      order: steps.length + 1,
      config: type === 'email' ? { 
        subject: '', 
        body: '' 
      } : type === 'task' ? { 
        taskTitle: '', 
        taskDueInDays: 1, 
        taskPriority: 'medium' 
      } : { 
        delayDays: 1 
      },
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, updates: Partial<SequenceStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleSave = () => {
    onSave({ name, description, targetType, steps });
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'task': return <ListTodo className="w-4 h-4" />;
      case 'delay': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>序列名称</Label>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="例如：新线索培育序列"
          />
        </div>
        <div>
          <Label>目标类型</Label>
          <Select value={targetType} onValueChange={v => setTargetType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">销售线索</SelectItem>
              <SelectItem value="opportunity">销售机会</SelectItem>
              <SelectItem value="customer">客户</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label>描述</Label>
        <Textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="描述这个序列的用途..."
        />
      </div>

      {/* 步骤列表 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>序列步骤</Label>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => addStep('email')}>
              <Mail className="w-4 h-4 mr-1" /> 邮件
            </Button>
            <Button size="sm" variant="outline" onClick={() => addStep('task')}>
              <ListTodo className="w-4 h-4 mr-1" /> 任务
            </Button>
            <Button size="sm" variant="outline" onClick={() => addStep('delay')}>
              <Clock className="w-4 h-4 mr-1" /> 等待
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
              <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-move" />
              <Badge variant="outline" className="shrink-0">
                步骤 {step.order}
              </Badge>
              <div className="flex items-center gap-2 text-gray-600">
                {getStepIcon(step.type)}
                <span>{step.type === 'email' ? '发送邮件' : step.type === 'task' ? '创建任务' : '等待'}</span>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-3">
                {step.type === 'email' && (
                  <>
                    <Input 
                      placeholder="邮件主题"
                      value={step.config.subject || ''}
                      onChange={e => updateStep(index, { 
                        config: { ...step.config, subject: e.target.value }
                      })}
                    />
                    <Input 
                      placeholder="邮件内容"
                      value={step.config.body || ''}
                      onChange={e => updateStep(index, { 
                        config: { ...step.config, body: e.target.value }
                      })}
                    />
                  </>
                )}
                {step.type === 'task' && (
                  <>
                    <Input 
                      placeholder="任务标题"
                      value={step.config.taskTitle || ''}
                      onChange={e => updateStep(index, { 
                        config: { ...step.config, taskTitle: e.target.value }
                      })}
                    />
                    <Input 
                      type="number"
                      placeholder="截止天数"
                      value={step.config.taskDueInDays || 1}
                      onChange={e => updateStep(index, { 
                        config: { ...step.config, taskDueInDays: parseInt(e.target.value) }
                      })}
                    />
                  </>
                )}
                {step.type === 'delay' && (
                  <Input 
                    type="number"
                    placeholder="等待天数"
                    value={step.config.delayDays || 1}
                    onChange={e => updateStep(index, { 
                      config: { ...step.config, delayDays: parseInt(e.target.value) }
                    })}
                    className="max-w-[200px]"
                  />
                )}
              </div>

              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => removeStep(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {steps.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            <p>点击上方按钮添加步骤</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>取消</Button>
        <Button onClick={handleSave}>保存序列</Button>
      </DialogFooter>
    </div>
  );
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all');

  useEffect(() => {
    setSequences(sequenceAPI.getAll());
  }, []);

  const handleSave = (data: Partial<Sequence>) => {
    if (editingSequence) {
      sequenceAPI.update(editingSequence.id, data);
    } else {
      sequenceAPI.create(data);
    }
    setSequences(sequenceAPI.getAll());
    setShowEditor(false);
    setEditingSequence(null);
  };

  const handleEdit = (sequence: Sequence) => {
    setEditingSequence(sequence);
    setShowEditor(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个序列吗？')) {
      sequenceAPI.delete(id);
      setSequences(sequenceAPI.getAll());
    }
  };

  const handleToggleStatus = (id: string) => {
    const seq = sequenceAPI.getById(id);
    if (seq?.status === 'active') {
      sequenceAPI.pause(id);
    } else {
      sequenceAPI.activate(id);
    }
    setSequences(sequenceAPI.getAll());
  };

  const filteredSequences = sequences.filter(s => 
    filter === 'all' ? true : s.status === filter
  );

  const stats = {
    total: sequences.length,
    active: sequences.filter(s => s.status === 'active').length,
    totalEnrolled: sequences.reduce((sum, s) => sum + s.stats.enrolled, 0),
    avgResponse: sequences.length > 0 
      ? Math.round(sequences.reduce((sum, s) => sum + s.stats.responseRate, 0) / sequences.length)
      : 0,
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">销售自动化序列</h1>
          <p className="text-gray-500">创建和管理自动化销售工作流</p>
        </div>
        <Button onClick={() => { setEditingSequence(null); setShowEditor(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          创建序列
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">总序列数</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600">进行中</div>
          <div className="text-2xl font-bold text-green-700">{stats.active}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600">总参与数</div>
          <div className="text-2xl font-bold text-blue-700">{stats.totalEnrolled}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600">平均响应率</div>
          <div className="text-2xl font-bold text-purple-700">{stats.avgResponse}%</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'paused', 'draft'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部' : f === 'active' ? '进行中' : f === 'paused' ? '已暂停' : '草稿'}
          </Button>
        ))}
      </div>

      {/* 序列列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSequences.map(seq => (
          <SequenceCard
            key={seq.id}
            sequence={seq}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      {filteredSequences.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无序列，点击上方按钮创建第一个销售自动化序列</p>
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSequence ? '编辑序列' : '创建新序列'}
            </DialogTitle>
          </DialogHeader>
          <SequenceEditor
            sequence={editingSequence}
            onSave={handleSave}
            onCancel={() => { setShowEditor(false); setEditingSequence(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
