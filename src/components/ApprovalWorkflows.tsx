import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ApprovalRequest {
  id: string;
  type: 'post' | 'campaign' | 'content';
  title: string;
  description: string;
  requestedBy: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  assignedTo: {
    id: string;
    name: string;
    avatar: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  dueDate: Date;
  content?: {
    text: string;
    platforms: string[];
    media?: string[];
  };
  comments: {
    id: string;
    author: string;
    message: string;
    timestamp: Date;
  }[];
}

export const ApprovalWorkflows: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([
    {
      id: '1',
      type: 'post',
      title: 'Holiday Campaign Launch Post',
      description: 'Social media post announcing our holiday campaign with special offers',
      requestedBy: {
        id: '1',
        name: 'Sarah Johnson',
        avatar: '/api/placeholder/32/32',
        role: 'Content Creator'
      },
      assignedTo: {
        id: '2',
        name: 'Mike Chen',
        avatar: '/api/placeholder/32/32'
      },
      status: 'pending',
      priority: 'high',
      createdAt: new Date('2024-01-15T10:00:00'),
      dueDate: new Date('2024-01-17T17:00:00'),
      content: {
        text: '🎄 Holiday Sale is here! Get 30% off all products. Limited time offer!',
        platforms: ['twitter', 'facebook', 'instagram'],
        media: ['/api/placeholder/400/300']
      },
      comments: []
    },
    {
      id: '2',
      type: 'campaign',
      title: 'Q1 Marketing Campaign Review',
      description: 'Complete campaign strategy and content calendar for Q1 2024',
      requestedBy: {
        id: '3',
        name: 'Alex Rivera',
        avatar: '/api/placeholder/32/32',
        role: 'Marketing Manager'
      },
      assignedTo: {
        id: '4',
        name: 'Emma Davis',
        avatar: '/api/placeholder/32/32'
      },
      status: 'revision_requested',
      priority: 'medium',
      createdAt: new Date('2024-01-10T14:30:00'),
      dueDate: new Date('2024-01-20T12:00:00'),
      comments: [
        {
          id: '1',
          author: 'Emma Davis',
          message: 'Please adjust the budget allocation for Instagram ads and add more video content.',
          timestamp: new Date('2024-01-14T09:15:00')
        }
      ]
    }
  ]);

  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newComment, setNewComment] = useState('');

  const filteredRequests = requests.filter(request => 
    filterStatus === 'all' || request.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'revision_requested': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
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

  const handleApproval = (requestId: string, action: 'approve' | 'reject' | 'request_revision') => {
    setRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision_requested'
            }
          : request
      )
    );
    
    const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent back for revision';
    toast({
      title: "Request Updated",
      description: `Request has been ${actionText}.`,
    });
  };

  const addComment = (requestId: string) => {
    if (!newComment.trim()) return;

    setRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? {
              ...request,
              comments: [
                ...request.comments,
                {
                  id: Date.now().toString(),
                  author: 'Current User',
                  message: newComment,
                  timestamp: new Date()
                }
              ]
            }
          : request
      )
    );
    
    setNewComment('');
    toast({
      title: "Comment Added",
      description: "Your comment has been added to the request.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="revision_requested">Revision Requested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedRequest(request)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(request.priority)}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.description}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={request.requestedBy.avatar} />
                        <AvatarFallback>{request.requestedBy.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {request.requestedBy.name}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={request.assignedTo.avatar} />
                        <AvatarFallback>{request.assignedTo.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {request.assignedTo.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{request.dueDate.toLocaleDateString()}</span>
                    </div>
                    {request.comments.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{request.comments.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Request Details */}
        {selectedRequest && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Request Details
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status.replace('_', ' ')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{selectedRequest.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.content && (
                <div>
                  <h5 className="font-medium mb-2">Content Preview</h5>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm mb-2">{selectedRequest.content.text}</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRequest.content.platforms.map(platform => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleApproval(selectedRequest.id, 'approve')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => handleApproval(selectedRequest.id, 'request_revision')}
                    variant="outline" 
                    className="w-full"
                  >
                    Request Revision
                  </Button>
                  <Button 
                    onClick={() => handleApproval(selectedRequest.id, 'reject')}
                    variant="destructive" 
                    className="w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              <div>
                <h5 className="font-medium mb-2">Comments ({selectedRequest.comments.length})</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedRequest.comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                      <div className="font-medium">{comment.author}</div>
                      <div className="text-gray-600 dark:text-gray-400">{comment.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {comment.timestamp.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button 
                    onClick={() => addComment(selectedRequest.id)}
                    size="sm"
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
