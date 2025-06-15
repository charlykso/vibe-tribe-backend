import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  assignedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  createdAt: Date;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  workload: number; // percentage
}

export const TaskAssignment: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Create Q1 Content Calendar',
      description: 'Develop comprehensive content calendar for Q1 2024 including all platforms and campaigns',
      assignee: {
        id: '1',
        name: 'Emma Davis',
        avatar: '/api/placeholder/32/32',
        role: 'Content Strategist'
      },
      assignedBy: {
        id: '2',
        name: 'Alex Rivera',
        avatar: '/api/placeholder/32/32'
      },
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date('2024-01-25'),
      createdAt: new Date('2024-01-15'),
      tags: ['content', 'planning', 'strategy'],
      estimatedHours: 16,
      actualHours: 8
    },
    {
      id: '2',
      title: 'Design Holiday Campaign Graphics',
      description: 'Create visual assets for holiday campaign across all social platforms',
      assignee: {
        id: '3',
        name: 'Sarah Johnson',
        avatar: '/api/placeholder/32/32',
        role: 'Designer'
      },
      assignedBy: {
        id: '2',
        name: 'Alex Rivera',
        avatar: '/api/placeholder/32/32'
      },
      status: 'review',
      priority: 'urgent',
      dueDate: new Date('2024-01-20'),
      createdAt: new Date('2024-01-10'),
      tags: ['design', 'campaign', 'graphics'],
      estimatedHours: 12,
      actualHours: 14
    }
  ]);

  const [teamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Emma Davis', avatar: '/api/placeholder/32/32', role: 'Content Strategist', workload: 75 },
    { id: '2', name: 'Alex Rivera', avatar: '/api/placeholder/32/32', role: 'Team Lead', workload: 60 },
    { id: '3', name: 'Sarah Johnson', avatar: '/api/placeholder/32/32', role: 'Designer', workload: 90 },
    { id: '4', name: 'Mike Chen', avatar: '/api/placeholder/32/32', role: 'Social Media Manager', workload: 45 },
    { id: '5', name: 'David Kim', avatar: '/api/placeholder/32/32', role: 'Content Writer', workload: 30 }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as const,
    dueDate: new Date(),
    tags: '',
    estimatedHours: 0
  });

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const assigneeMatch = filterAssignee === 'all' || task.assignee.id === filterAssignee;
    const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && assigneeMatch && searchMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'text-red-600';
    if (workload >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.assigneeId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const assignee = teamMembers.find(member => member.id === newTask.assigneeId);
    if (!assignee) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      assignee: {
        id: assignee.id,
        name: assignee.name,
        avatar: assignee.avatar,
        role: assignee.role
      },
      assignedBy: {
        id: 'current-user',
        name: 'Current User',
        avatar: '/api/placeholder/32/32'
      },
      status: 'todo',
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      createdAt: new Date(),
      tags: newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      estimatedHours: newTask.estimatedHours
    };

    setTasks(prev => [task, ...prev]);
    setNewTask({
      title: '',
      description: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: new Date(),
      tags: '',
      estimatedHours: 0
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Task Created",
      description: `Task assigned to ${assignee.name}`,
    });
  };

  const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    
    toast({
      title: "Task Updated",
      description: `Task status changed to ${newStatus.replace('_', ' ')}`,
    });
  };

  const getTasksByStatus = (status: Task['status']) => {
    return filteredTasks.filter(task => task.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Assignment</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track team tasks</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Assignee *</label>
                <Select value={newTask.assigneeId} onValueChange={(value) => setNewTask(prev => ({ ...prev, assigneeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                          <span className={`text-xs ${getWorkloadColor(member.workload)}`}>
                            ({member.workload}%)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Est. Hours</label>
                  <Input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newTask.dueDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newTask.dueDate}
                      onSelect={(date) => date && setNewTask(prev => ({ ...prev, dueDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium">Tags</label>
                <Input
                  value={newTask.tags}
                  onChange={(e) => setNewTask(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="content, design, urgent (comma separated)"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {teamMembers.map(member => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['todo', 'in_progress', 'review', 'completed'] as const).map(status => (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="capitalize">{status.replace('_', ' ')}</span>
                <Badge variant="outline" className="text-xs">
                  {getTasksByStatus(status).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {getTasksByStatus(status).map(task => (
                <div key={task.id} className="p-3 border rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} mt-2`} />
                    <Badge className={getStatusColor(task.status)} onClick={() => {
                      const statuses: Task['status'][] = ['todo', 'in_progress', 'review', 'completed'];
                      const currentIndex = statuses.indexOf(task.status);
                      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                      updateTaskStatus(task.id, nextStatus);
                    }}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {task.assignee.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{format(task.dueDate, 'MMM dd')}</span>
                    </div>
                  </div>
                  
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{task.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
