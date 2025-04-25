import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define types for our data
interface Candidate {
  id: number;
  name: string;
  party: string;
  description: string;
  imageUrl?: string;
}

interface Voter {
  id: number;
  username: string;
  voterId: string;
  hasFingerprint: boolean;
  hasVoted: boolean;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form validation schema for candidates
const candidateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  party: z.string().min(2, { message: "Party must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  imageUrl: z.string().optional(),
});

// Form validation schema for voters
const voterSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  voterId: z.string().min(5, { message: "Voter ID must be at least 5 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }).optional(),
});

export default function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("candidates");

  // Fetch candidates
  const { data: candidates = [] as Candidate[], isLoading: isLoadingCandidates, refetch: refetchCandidates } = useQuery<Candidate[]>({
    queryKey: ['/api/candidates'],
  });

  // Fetch voters
  const { data: voters = [] as Voter[], isLoading: isLoadingVoters, refetch: refetchVoters } = useQuery<Voter[]>({
    queryKey: ['/api/admin/voters'],
  });

  // Candidate form
  const candidateForm = useForm<z.infer<typeof candidateSchema>>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: "",
      party: "",
      description: "",
      imageUrl: "",
    },
  });

  // Voter form
  const voterForm = useForm<z.infer<typeof voterSchema>>({
    resolver: zodResolver(voterSchema),
    defaultValues: {
      username: "",
      voterId: "",
      password: "",
      phone: "",
    },
  });

  // Submit candidate form
  const onSubmitCandidate = async (values: z.infer<typeof candidateSchema>) => {
    try {
      await apiRequest('POST', '/api/admin/candidates', values);
      toast({
        title: "Success",
        description: "Candidate added successfully",
        variant: "default",
      });
      candidateForm.reset();
      refetchCandidates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add candidate",
        variant: "destructive",
      });
    }
  };

  // Submit voter form
  const onSubmitVoter = async (values: z.infer<typeof voterSchema>) => {
    try {
      await apiRequest('POST', '/api/admin/voters', values);
      toast({
        title: "Success",
        description: "Voter added successfully",
        variant: "default",
      });
      voterForm.reset();
      refetchVoters();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add voter",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="candidates" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="candidates">Manage Candidates</TabsTrigger>
          <TabsTrigger value="voters">Manage Voters</TabsTrigger>
        </TabsList>
        
        <TabsContent value="candidates" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Add Candidate Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Candidate</CardTitle>
                <CardDescription>Fill in the details to add a new candidate</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...candidateForm}>
                  <form onSubmit={candidateForm.handleSubmit(onSubmitCandidate)} className="space-y-4">
                    <FormField
                      control={candidateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter candidate name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={candidateForm.control}
                      name="party"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Party</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter political party" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={candidateForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter candidate description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={candidateForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter image URL" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank for default image
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={candidateForm.formState.isSubmitting}>
                      {candidateForm.formState.isSubmitting ? "Submitting..." : "Add Candidate"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Candidates List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Candidates</CardTitle>
                <CardDescription>List of all registered candidates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCandidates ? (
                  <div className="text-center py-6">Loading candidates...</div>
                ) : candidates && candidates.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Party</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((candidate: Candidate) => (
                        <TableRow key={candidate.id}>
                          <TableCell>{candidate.id}</TableCell>
                          <TableCell>{candidate.name}</TableCell>
                          <TableCell>{candidate.party}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">No candidates found</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="voters" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Add Voter Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Voter</CardTitle>
                <CardDescription>Fill in the details to add a new voter</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...voterForm}>
                  <form onSubmit={voterForm.handleSubmit(onSubmitVoter)} className="space-y-4">
                    <FormField
                      control={voterForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={voterForm.control}
                      name="voterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voter ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter voter ID (e.g. V12345)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={voterForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={voterForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={voterForm.formState.isSubmitting}>
                      {voterForm.formState.isSubmitting ? "Submitting..." : "Add Voter"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Voters List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Voters</CardTitle>
                <CardDescription>List of all registered voters</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingVoters ? (
                  <div className="text-center py-6">Loading voters...</div>
                ) : voters && voters.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Voter ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voters.map((voter: Voter) => (
                        <TableRow key={voter.id}>
                          <TableCell>{voter.id}</TableCell>
                          <TableCell>{voter.username}</TableCell>
                          <TableCell>{voter.voterId}</TableCell>
                          <TableCell>
                            {voter.hasVoted ? (
                              <span className="text-red-500">Voted</span>
                            ) : (
                              <span className="text-green-500">Not Voted</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">No voters found</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}