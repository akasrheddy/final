import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import FingerprintScanner from "./fingerprint-scanner";
import SystemStatus from "./system-status";
import { registerFingerprint, verifyFingerprint } from "@/lib/arduino";
import { useToast } from "@/hooks/use-toast";

interface AuthenticationSectionProps {
  onVerificationSuccess: () => void;
}

const formSchema = z.object({
  voterId: z.string().min(1, "Voter ID is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits")
});

type FormValues = z.infer<typeof formSchema>;

export default function AuthenticationSection({ onVerificationSuccess }: AuthenticationSectionProps) {
  const [scannerStatus, setScannerStatus] = useState("Ready to scan");
  const [isScanning, setIsScanning] = useState(false);
  const [helpText, setHelpText] = useState("Enter voter ID format: V00001, V00002, or V00003");
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voterId: "V00001",  // Prefill with a valid voter ID for testing
      phone: "1234567890"
    }
  });
  
  const onVerify = async (values: FormValues) => {
    if (!values.voterId) {
      form.setError("voterId", { message: "Voter ID is required" });
      return;
    }
    
    // Start the scanning animation
    setIsScanning(true);
    setScannerStatus("Scanning...");
    
    try {
      // Store voter ID in session storage for later use
      sessionStorage.setItem('voterId', values.voterId);
      
      // Simulate verification with the fingerprint sensor
      setTimeout(async () => {
        try {
          const response = await verifyFingerprint(values.voterId);
          
          if (response.verified) {
            setIsScanning(false);
            setScannerStatus("Fingerprint verified!");
            toast({
              title: "Verification Successful",
              description: "Your identity has been verified.",
            });
            // Call the success callback after a short delay
            setTimeout(onVerificationSuccess, 1000);
          } else {
            setIsScanning(false);
            setScannerStatus("Verification failed. Try again.");
            toast({
              title: "Verification Failed",
              description: response.message || "Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          setIsScanning(false);
          setScannerStatus("Error verifying fingerprint");
          toast({
            title: "Verification Error",
            description: "Failed to verify fingerprint. Please try again.",
            variant: "destructive",
          });
        }
      }, 2000);
    } catch (error) {
      setIsScanning(false);
      setScannerStatus("Error verifying fingerprint");
      toast({
        title: "Verification Error",
        description: "Failed to verify fingerprint. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const onRegister = async () => {
    const voterId = form.getValues("voterId");
    if (!voterId) {
      form.setError("voterId", { message: "Voter ID is required" });
      return;
    }
    
    // Start the scanning animation
    setIsScanning(true);
    setScannerStatus("Scanning...");
    
    try {
      // Simulate fingerprint registration
      setTimeout(async () => {
        try {
          const response = await registerFingerprint(voterId);
          
          if (response.success) {
            setIsScanning(false);
            setScannerStatus("Fingerprint registered!");
            toast({
              title: "Registration Successful",
              description: "Your fingerprint has been registered.",
            });
          } else {
            setIsScanning(false);
            setScannerStatus("Registration failed. Try again.");
            toast({
              title: "Registration Failed",
              description: response.message || "Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          setIsScanning(false);
          setScannerStatus("Error registering fingerprint");
          toast({
            title: "Registration Error",
            description: "Failed to register fingerprint. Please try again.",
            variant: "destructive",
          });
        }
      }, 2000);
    } catch (error) {
      setIsScanning(false);
      setScannerStatus("Error registering fingerprint");
      toast({
        title: "Registration Error",
        description: "Failed to register fingerprint. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <section id="authentication-section" className="mb-10">
      <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold text-neutral-dark mb-4">Biometric Authentication</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onVerify)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center justify-center">
                  <FingerprintScanner 
                    status={scannerStatus} 
                    isScanning={isScanning}
                  />
                </div>
                
                <div className="md:col-span-2 flex flex-col justify-center">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-neutral-dark mb-2">Voter Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="voterId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voter ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your voter ID" 
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="Enter your phone number" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      type="button"
                      onClick={onRegister}
                      className="bg-accent hover:bg-amber-600 text-white font-semibold"
                    >
                      Register Fingerprint
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-primary hover:bg-blue-700 text-white font-semibold"
                    >
                      Verify & Proceed
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <SystemStatus />
    </section>
  );
}
