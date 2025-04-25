import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Form validation schema for voters
const voterSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  voterId: z.string().min(5, { message: 'Voter ID must be at least 5 characters' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }).optional(),
});

export default function Register() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Voter form
  const voterForm = useForm<z.infer<typeof voterSchema>>({
    resolver: zodResolver(voterSchema),
    defaultValues: {
      username: '',
      voterId: '',
      password: '',
      phone: '',
    },
  });

  // Submit voter form
  const onSubmitVoter = async (values: z.infer<typeof voterSchema>) => {
    try {
      setIsSubmitting(true);
      await apiRequest('POST', '/api/admin/voters', values);
      toast({
        title: 'Registration Successful',
        description: 'You have successfully registered as a voter.',
        variant: 'default',
      });
      
      // Redirect to home page after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: 'Failed to register. This Voter ID or username may already exist.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Voter Registration</CardTitle>
            <CardDescription>
              Register as a new voter to participate in the secure blockchain voting system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...voterForm}>
              <form onSubmit={voterForm.handleSubmit(onSubmitVoter)} className="space-y-5">
                <FormField
                  control={voterForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Create a username" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be used to identify you in the system
                      </FormDescription>
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
                        <Input placeholder="Enter your voter ID (e.g. V12345)" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your unique voter identification number
                      </FormDescription>
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
                        <Input type="password" placeholder="Create a secure password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters
                      </FormDescription>
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
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormDescription>
                        For verification and updates about the election
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? "Registering..." : "Register as Voter"}
                  </Button>
                </div>

                <div className="text-center mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/')}
                    className="text-gray-500 hover:text-primary"
                  >
                    Already registered? Back to home
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}