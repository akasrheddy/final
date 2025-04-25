import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { registerFingerprint } from '@/lib/arduino';
import FingerprintScanner from '@/components/fingerprint-scanner';

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
  const [registrationStep, setRegistrationStep] = useState<'form' | 'fingerprint' | 'complete'>('form');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [registeredVoter, setRegisteredVoter] = useState<{id: number, username: string, voterId: string}>();
  
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
      const response = await apiRequest('POST', '/api/admin/voters', values);
      const data = await response.json();
      
      setRegisteredVoter({
        id: data.id,
        username: data.username,
        voterId: data.voterId
      });
      
      toast({
        title: 'Account Created',
        description: 'Now let\'s register your fingerprint.',
        variant: 'default',
      });
      
      setRegistrationStep('fingerprint');
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
  
  // Register fingerprint
  const handleFingerprintRegistration = async () => {
    if (!registeredVoter) return;
    
    try {
      setIsScanning(true);
      setScanStatus("Place your finger on the scanner...");
      
      const result = await registerFingerprint(registeredVoter.voterId);
      
      if (result.success) {
        setScanStatus("Fingerprint registered successfully!");
        toast({
          title: 'Registration Complete',
          description: 'Your fingerprint has been registered successfully.',
          variant: 'default',
        });
        
        setRegistrationStep('complete');
        
        // Redirect to home page after a brief delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setScanStatus("Failed to register fingerprint. Please try again.");
        toast({
          title: 'Fingerprint Registration Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      setScanStatus("An error occurred. Please try again.");
      toast({
        title: 'Error',
        description: 'An error occurred while registering the fingerprint.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Render based on current registration step
  const renderRegistrationStep = () => {
    switch (registrationStep) {
      case 'form':
        return (
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Voter Registration</CardTitle>
              <CardDescription>
                Step 1: Register your voter information
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
                      {isSubmitting ? "Registering..." : "Continue to Fingerprint Registration"}
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
        );
        
      case 'fingerprint':
        return (
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Fingerprint Registration</CardTitle>
              <CardDescription>
                Step 2: Register your fingerprint for secure authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="mb-6 text-center">
                <Alert className="mb-6 bg-primary/5">
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Place your finger on the scanner when prompted. You'll need this same finger when voting.
                  </AlertDescription>
                </Alert>
                
                <div className="my-8">
                  <FingerprintScanner status={scanStatus} isScanning={isScanning} />
                </div>
                
                {!isScanning && (
                  <Button 
                    onClick={handleFingerprintRegistration}
                    className="mt-4"
                    size="lg"
                    disabled={isScanning}
                  >
                    Start Fingerprint Scan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      case 'complete':
        return (
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-600">Registration Complete!</CardTitle>
              <CardDescription>
                You have successfully registered as a voter
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 text-green-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mb-6 text-lg">
                Your voter information and fingerprint have been registered successfully.
              </p>
              <p className="text-gray-500 mb-6">
                You will be redirected to the home page shortly.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/')}>
                Return to Home Page
              </Button>
            </CardFooter>
          </Card>
        );
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        {renderRegistrationStep()}
      </div>
    </div>
  );
}