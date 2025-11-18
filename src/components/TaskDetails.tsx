import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Paperclip,
} from 'lucide-react';
import type { Task, User as UserType } from '../types';

interface TaskDetailsProps {
  task: Task;
  users: UserType[];
  currentUser: UserType;
  onBack: () => void;
}

export function TaskDetails({ task, users, currentUser, onBack }: TaskDetailsProps) {
  const [newComment, setNewComment] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const assignedUsers = task.assignedTo
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as UserType[];

  const createdByUser = users.find((u) => u.id === task.assignedBy);

  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const timeProgress = task.estimatedTime
    ? ((task.timeSpent || 0) / task.estimatedTime) * 100
    : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'destructive';
      case 'High':
        return 'default';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'On Hold':
        return 'outline';
      case 'To Do':
        return 'destructive';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1>{task.title}</h1>
          <p className="text-gray-500">{task.project}</p>
        </div>
        <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
        <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{task.description}</p>
            </CardContent>
          </Card>

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subtasks</CardTitle>
                <span className="text-sm text-gray-500">
                  {completedSubtasks} of {totalSubtasks} completed
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} />
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                      <span
                        className={
                          subtask.completed
                            ? 'flex-1 text-gray-500 line-through'
                            : 'flex-1'
                        }
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              <div className="space-y-4">
                {task.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {comment.userName.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{comment.userName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* New Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment... (Use @name to mention someone)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={() => setNewComment('')}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded by {attachment.uploadedBy} on{' '}
                            {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Time Spent</span>
                <span className="text-sm">{task.timeSpent || 0}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated</span>
                <span className="text-sm">{task.estimatedTime || 0}h</span>
              </div>
              <Progress value={timeProgress} />
              <Button
                variant={isTimerRunning ? 'destructive' : 'default'}
                className="w-full"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Timer
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Timer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Due Date</span>
                </div>
                <p className="text-sm">
                  {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Assigned To</span>
                </div>
                <div className="space-y-2">
                  {assignedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Created By</span>
                </div>
                <p className="text-sm">{createdByUser?.name}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Department</span>
                </div>
                <p className="text-sm">{task.department}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="text-sm">
                  {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
