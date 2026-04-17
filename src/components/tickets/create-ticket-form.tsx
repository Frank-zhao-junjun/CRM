'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, User, AlertCircle } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  company: string;
}

interface CreateTicketFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (ticketId: string) => void;
  defaultCustomerId?: string;
}

// 类型定义
type TicketType = 'inquiry' | 'technical' | 'complaint' | 'other';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

const TICKET_TYPES: { value: TicketType; label: string; description: string }[] = [
  { value: 'inquiry', label: '问题咨询', description: '客户提出的各类问题咨询' },
  { value: 'technical', label: '技术故障', description: '系统或产品技术相关问题' },
  { value: 'complaint', label: '投诉建议', description: '客户投诉或改进建议' },
  { value: 'other', label: '其他', description: '其他类型的工单' },
];

const PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low', label: '低优先级', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'medium', label: '中优先级', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: 'high', label: '高优先级', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { value: 'urgent', label: '紧急', color: 'bg-red-100 text-red-600 border-red-200' },
];

export function CreateTicketForm({ 
  open, 
  onClose, 
  onSuccess,
  defaultCustomerId 
}: CreateTicketFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: defaultCustomerId || '',
    customerName: '',
    type: 'inquiry' as TicketType,
    priority: 'medium' as TicketPriority,
    assigneeId: '',
    assigneeName: '',
    initialComment: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 加载客户列表
  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open, customerSearch]);

  const loadCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (customerSearch) params.set('search', customerSearch);
      params.set('limit', '20');
      
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('加载客户失败:', error);
    }
  };

  // 选择客户
  const handleSelectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.company || customer.name,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearch('');
    setErrors(prev => ({ ...prev, customerId: '' }));
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入工单标题';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请输入工单描述';
    }
    
    if (!formData.customerId) {
      newErrors.customerId = '请选择关联客户';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            title: formData.title.trim(),
            description: formData.description.trim(),
            customerId: formData.customerId,
            type: formData.type,
            priority: formData.priority,
            assigneeId: formData.assigneeId || null,
            assigneeName: formData.assigneeName || null,
            createdBy: 'staff',
            createdByName: '客服人员',
            initialComment: formData.initialComment.trim() || null,
          },
        }),
      });
      
      const data = await res.json();
      
      if (data.id) {
        onSuccess?.(data.id);
        handleClose();
        router.push(`/tickets/${data.id}`);
      } else {
        setErrors({ submit: data.error || '创建失败' });
      }
    } catch (error) {
      console.error('创建工单失败:', error);
      setErrors({ submit: '创建失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      customerId: defaultCustomerId || '',
      customerName: '',
      type: 'inquiry',
      priority: 'medium',
      assigneeId: '',
      assigneeName: '',
      initialComment: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">创建服务工单</span>
          </DialogTitle>
          <DialogDescription>
            填写以下信息创建新的客户服务工单
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 客户选择 */}
          <div className="space-y-2">
            <Label htmlFor="customer">
              关联客户 <span className="text-red-500">*</span>
            </Label>
            {formData.customerId ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Building2 className="h-4 w-4 text-green-600" />
                <span className="text-green-700">{formData.customerName}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto text-green-600"
                  onClick={() => setFormData(prev => ({ ...prev, customerId: '', customerName: '' }))}
                >
                  更换
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer"
                    placeholder="搜索客户名称或公司..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="pl-9"
                  />
                </div>
                
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          {customer.company && (
                            <div className="text-sm text-muted-foreground">{customer.company}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.customerId && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.customerId}
              </p>
            )}
          </div>

          {/* 工单标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">
              工单标题 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="请简要描述工单内容"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                setErrors(prev => ({ ...prev, title: '' }));
              }}
            />
            {errors.title && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* 工单描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">
              工单描述 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="请详细描述客户的问题或需求..."
              rows={4}
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                setErrors(prev => ({ ...prev, description: '' }));
              }}
            />
            {errors.description && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* 类型和优先级 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>工单类型</Label>
              <div className="grid grid-cols-2 gap-2">
                {TICKET_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>优先级</Label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map((priority) => (
                  <div
                    key={priority.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                      formData.priority === priority.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                  >
                    <Badge className={priority.color}>{priority.label}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 分配给 */}
          <div className="space-y-2">
            <Label htmlFor="assignee">分配给</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="assignee"
                placeholder="输入处理人姓名（可选）"
                value={formData.assigneeName}
                onChange={(e) => setFormData(prev => ({ ...prev, assigneeName: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          {/* 初始回复 */}
          <div className="space-y-2">
            <Label htmlFor="initialComment">初始回复</Label>
            <Textarea
              id="initialComment"
              placeholder="输入初始回复内容（可选）"
              rows={2}
              value={formData.initialComment}
              onChange={(e) => setFormData(prev => ({ ...prev, initialComment: e.target.value }))}
            />
          </div>

          {/* 错误提示 */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.submit}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              '创建工单'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
