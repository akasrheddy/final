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

export default function AdminPanel() {
  const { toast } = useToast();

  // Fetch candidates
  const { data: candidates = [] as Candidate[], isLoading: isLoadingCandidates, refetch: refetchCandidates } = useQuery<Candidate[]>({
    queryKey: ['/api/candidates'],
  });

  // Fetch voters
  const { data: voters = [] as Voter[], isLoading: isLoadingVoters } = useQuery<Voter[]>({
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

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Administration Panel</h1>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Manage Candidates</h2>
          
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
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Candidates</h2>
          {/* Candidates List */}
          <Card>
            <CardContent className="pt-6">
              {isLoadingCandidates ? (
                <div className="text-center py-6">Loading candidates...</div>
              ) : candidates && candidates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate: Candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>{candidate.id}</TableCell>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell>{candidate.party}</TableCell>
                        <TableCell className="truncate max-w-[200px]">{candidate.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">No candidates found</div>
              )}
            </CardContent>
          </Card>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Registered Voters</h2>
          {/* Voters List */}
          <Card>
            <CardContent className="pt-6">
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Voted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Not Voted
                            </span>
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
      </div>
    </div>
  );
}