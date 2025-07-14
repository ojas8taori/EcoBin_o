import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Users, 
  Plus, 
  MapPin, 
  Camera, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trophy,
  Medal,
  Award,
  Flag,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Recycle,
  ShoppingBag,
  Gift,
  Star,
  Package,
  DollarSign,
  Tag,
  Image
} from "lucide-react";

const reportSchema = z.object({
  reportType: z.string().min(1, "Please select a report type"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(5, "Location must be at least 5 characters"),
  priority: z.string().optional(),
});

const marketplaceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  condition: z.string().min(1, "Please select condition"),
  estimatedValue: z.string().min(1, "Estimated value is required"),
  location: z.string().min(3, "Location is required"),
  contactMethod: z.string().min(1, "Please select contact method"),
  contactInfo: z.string().min(3, "Contact info is required"),
  ecoPointsReward: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;
type MarketplaceFormData = z.infer<typeof marketplaceSchema>;

export default function Community() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("reports");
  const [showReportForm, setShowReportForm] = useState(false);
  const [showMarketplaceForm, setShowMarketplaceForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "",
      description: "",
      location: "",
      priority: "medium",
    },
  });

  const marketplaceForm = useForm<MarketplaceFormData>({
    resolver: zodResolver(marketplaceSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      condition: "",
      estimatedValue: "",
      location: "",
      contactMethod: "",
      contactInfo: "",
      ecoPointsReward: "10",
    },
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/community-reports"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/cleanup-events"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: marketplaceItems, isLoading: marketplaceLoading } = useQuery({
    queryKey: ["/api/marketplace", selectedCategory],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: userMarketplaceItems } = useQuery({
    queryKey: ["/api/marketplace/my-items"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: availableRewards } = useQuery({
    queryKey: ["/api/rewards"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: userRewards } = useQuery({
    queryKey: ["/api/user/rewards"],
    retry: false,
    enabled: isAuthenticated,
  });

  const reportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const response = await apiRequest("POST", "/api/community-reports", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-reports"] });
      toast({
        title: "Report Submitted",
        description: "Thank you for reporting this issue!",
      });
      setShowReportForm(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest("POST", `/api/cleanup-events/${eventId}/join`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cleanup-events"] });
      toast({
        title: "Success",
        description: "You've joined the cleanup event!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to join event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportFormData) => {
    reportMutation.mutate(data);
  };

  const marketplaceMutation = useMutation({
    mutationFn: async (data: MarketplaceFormData) => {
      const response = await apiRequest("POST", "/api/marketplace", {
        ...data,
        ecoPointsReward: parseInt(data.ecoPointsReward || "10"),
        estimatedValue: parseFloat(data.estimatedValue),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-items"] });
      toast({
        title: "Item Posted",
        description: "Your item has been posted to the marketplace!",
      });
      setShowMarketplaceForm(false);
      marketplaceForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to post item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const redeemRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await apiRequest("POST", `/api/rewards/${rewardId}/redeem`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Reward Redeemed",
        description: "Your reward has been redeemed successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to redeem reward. Please check your EcoPoints balance.",
        variant: "destructive",
      });
    },
  });

  const onMarketplaceSubmit = (data: MarketplaceFormData) => {
    marketplaceMutation.mutate(data);
  };

  if (isLoading || reportsLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "investigating":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "reported":
        return <Flag className="h-4 w-4" />;
      case "investigating":
        return <Eye className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 dark:text-red-400";
      case "high":
        return "text-orange-600 dark:text-orange-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const reportTypes = [
    { value: "overflowing_bin", label: "Overflowing Bin", icon: "🗑️" },
    { value: "illegal_dumping", label: "Illegal Dumping", icon: "🚫" },
    { value: "cleanup_needed", label: "Cleanup Needed", icon: "🧹" },
    { value: "broken_bin", label: "Broken Bin", icon: "🔧" },
    { value: "other", label: "Other", icon: "❓" },
  ];

  const leaderboard = [
    { name: "EcoWarrior123", points: 15420, badge: "🏆 Gold Badge", rank: 1 },
    { name: "GreenGuardian", points: 12850, badge: "🥈 Silver Badge", rank: 2 },
    { name: "EcoChampion", points: 11340, badge: "🥉 Bronze Badge", rank: 3 },
    { name: "You", points: user?.ecoPoints || 0, badge: "🌟 Your Rank", rank: 4 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Community Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect with your community and make a difference together
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>

          {/* Community Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Community Reports
              </h2>
              <Button
                onClick={() => setShowReportForm(true)}
                className="bg-eco-green hover:bg-eco-dark-green text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </div>

            {/* Report Form */}
            {showReportForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Report Community Issue</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="reportType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Report Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select report type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {reportTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center space-x-2">
                                        <span>{type.icon}</span>
                                        <span>{type.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter location details..." {...field} />
                            </FormControl>
                            <FormDescription>
                              Please provide specific location details including landmarks
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the issue in detail..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowReportForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-eco-green hover:bg-eco-dark-green text-white"
                          disabled={reportMutation.isPending}
                        >
                          {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Reports List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports && reports.length > 0 ? (
                reports.map((report: any) => (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(report.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(report.status)}
                            <span className="capitalize">{report.status}</span>
                          </div>
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${getPriorityColor(report.priority)} border-current`}
                        >
                          {report.priority?.toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg capitalize">
                        {report.reportType.replace('_', ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {report.description}
                      </p>

                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>{report.location}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-4">
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-eco-green">
                            <Heart className="h-4 w-4 mr-1" />
                            <span className="text-xs">Support</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-eco-green">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Comment</span>
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-eco-green">
                          <Share2 className="h-4 w-4 mr-1" />
                          <span className="text-xs">Share</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2">
                  <Card>
                    <CardContent className="text-center py-12">
                      <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No reports yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Be the first to report a community issue
                      </p>
                      <Button
                        onClick={() => setShowReportForm(true)}
                        className="bg-eco-green hover:bg-eco-dark-green text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Cleanup Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cleanup Events
              </h2>
              <Button variant="outline" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events && events.length > 0 ? (
                events.map((event: any) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge className="bg-eco-green text-white">
                          {event.currentParticipants}/{event.maxParticipants}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {event.description}
                      </p>

                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(event.eventDate), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{event.duration} minutes</span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Award className="h-5 w-5 text-eco-green" />
                          <span className="text-sm font-medium text-eco-green">
                            +{event.ecoPointsReward} EcoPoints
                          </span>
                        </div>
                        <Button
                          onClick={() => joinEventMutation.mutate(event.id)}
                          className="bg-eco-green hover:bg-eco-dark-green text-white"
                          disabled={joinEventMutation.isPending || event.currentParticipants >= event.maxParticipants}
                        >
                          {joinEventMutation.isPending ? "Joining..." : "Join Event"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2">
                  <Card>
                    <CardContent className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No upcoming events
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Check back later for community cleanup events
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Community Leaderboard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaderboard.map((member, index) => (
                <Card key={index} className={`hover:shadow-lg transition-shadow ${member.name === 'You' ? 'ring-2 ring-eco-green' : ''}`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      {index === 0 && (
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                          <Trophy className="h-8 w-8 text-white" />
                        </div>
                      )}
                      {index === 1 && (
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                          <Medal className="h-8 w-8 text-white" />
                        </div>
                      )}
                      {index === 2 && (
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                          <Award className="h-8 w-8 text-white" />
                        </div>
                      )}
                      {index > 2 && (
                        <div className="w-16 h-16 bg-gradient-to-br from-eco-green to-green-600 rounded-full flex items-center justify-center">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {member.points.toLocaleString()} EcoPoints
                    </p>
                    <Badge className="text-xs">
                      {member.badge}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Community Impact Tab */}
          <TabsContent value="impact" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Community Impact
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-red-500 mb-2">2B+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Tons Waste Generated Annually</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Recycle className="h-6 w-6 text-orange-500" />
                  </div>
                  <p className="text-3xl font-bold text-orange-500 mb-2">1/3</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Food Production Wasted</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="text-3xl font-bold text-amber-500 mb-2">Millions</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Marine Animals Die from Plastic</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-500 mb-2">Small %</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Plastic Actually Recycled</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-eco-green/10 to-blue-500/10">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Together We're Making a Difference
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Our community has collectively reduced carbon emissions by thousands of tons
                    and created cleaner, healthier neighborhoods for everyone.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-eco-green mb-2">2,500 tons</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">CO₂ Prevented</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-500 mb-2">15,000</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Trees Saved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-500 mb-2">85%</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Waste Diverted</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Marketplace - Exchange & Share
              </h2>
              <Button
                onClick={() => setShowMarketplaceForm(true)}
                className="bg-eco-green hover:bg-eco-dark-green"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post Item
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {['all', 'electronics', 'furniture', 'books', 'clothing', 'tools', 'other'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === 'all' ? 'All Items' : category}
                </Button>
              ))}
            </div>

            {/* Marketplace Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceItems?.map((item: any) => (
                <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-eco-green transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {item.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {item.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.location}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${item.estimatedValue}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-eco-green">
                          <Star className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">+{item.ecoPointsReward} EcoPoints</span>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {item.condition}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <Button size="sm" variant="outline">
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {marketplaceItems?.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No items yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Be the first to post an item to the marketplace!
                </p>
              </div>
            )}
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Redeem EcoPoints
            </h2>
            
            <div className="bg-gradient-to-r from-eco-green/10 to-blue-500/10 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your EcoPoints Balance
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use your points to make a real environmental impact
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-eco-green">{user?.ecoPoints || 0}</p>
                  <p className="text-sm text-gray-500">EcoPoints</p>
                </div>
              </div>
            </div>

            {/* Available Rewards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRewards?.map((reward: any) => (
                <Card key={reward.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-eco-green/10 rounded-lg">
                          <Gift className="h-6 w-6 text-eco-green" />
                        </div>
                        <Badge variant="outline">{reward.category}</Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {reward.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {reward.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center text-eco-green">
                          <Star className="h-4 w-4 mr-1" />
                          <span className="font-semibold">{reward.ecoPointsCost} points</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => redeemRewardMutation.mutate(reward.id)}
                          disabled={redeemRewardMutation.isPending || (user?.ecoPoints || 0) < reward.ecoPointsCost}
                          className="bg-eco-green hover:bg-eco-dark-green"
                        >
                          {redeemRewardMutation.isPending ? "Redeeming..." : "Redeem"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* My Redeemed Rewards */}
            {userRewards && userRewards.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  My Redeemed Rewards
                </h3>
                <div className="space-y-3">
                  {userRewards.slice(0, 5).map((userReward: any) => (
                    <div key={userReward.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <Gift className="h-5 w-5 text-eco-green mr-3" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{userReward.reward?.title}</p>
                          <p className="text-sm text-gray-500">Redemption Code: {userReward.redemptionCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Redeemed</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(userReward.redeemedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableRewards?.length === 0 && (
              <div className="text-center py-12">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No rewards available
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Check back later for new rewards!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Marketplace Form Modal */}
        {showMarketplaceForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Post Item to Marketplace
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMarketplaceForm(false)}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>

                <Form {...marketplaceForm}>
                  <form onSubmit={marketplaceForm.handleSubmit(onMarketplaceSubmit)} className="space-y-4">
                    <FormField
                      control={marketplaceForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Vintage Desk Lamp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={marketplaceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your item's condition, features, and why you're sharing it"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={marketplaceForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="electronics">Electronics</SelectItem>
                                <SelectItem value="furniture">Furniture</SelectItem>
                                <SelectItem value="books">Books</SelectItem>
                                <SelectItem value="clothing">Clothing</SelectItem>
                                <SelectItem value="tools">Tools</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={marketplaceForm.control}
                        name="condition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condition</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair</SelectItem>
                                <SelectItem value="needs_repair">Needs Repair</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={marketplaceForm.control}
                      name="estimatedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Value ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={marketplaceForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, State or Zip Code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={marketplaceForm.control}
                      name="contactMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How to contact you" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="message">App Message</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={marketplaceForm.control}
                      name="contactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Information</FormLabel>
                          <FormControl>
                            <Input placeholder="Email or phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={marketplaceForm.control}
                      name="ecoPointsReward"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EcoPoints Reward</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="10" {...field} />
                          </FormControl>
                          <FormDescription>
                            Points you'll earn for posting this item
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowMarketplaceForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={marketplaceMutation.isPending}
                        className="flex-1 bg-eco-green hover:bg-eco-dark-green"
                      >
                        {marketplaceMutation.isPending ? "Posting..." : "Post Item"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
