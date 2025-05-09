'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import Link from 'next/link';
import GonzigoBrand from '@/components/gonzigo-brand';
import {
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcDiscover,
  FaLock,
  FaCheck
} from 'react-icons/fa';

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('1');
  const [additionalLicenses, setAdditionalLicenses] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountType, setDiscountType] = useState<string>('percentage');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState('');
  const [discountCodeId, setDiscountCodeId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate pricing
  const basePlanPrice = selectedPlan === '1' ? 30 : 100;
  const additionalLicensesPrice = selectedPlan === '5' ? additionalLicenses * 10 : 0;
  const basePrice = basePlanPrice + additionalLicensesPrice;

  // Calculate discount based on type
  let calculatedDiscount = 0;
  if (discountApplied) {
    if (discountType === 'percentage') {
      calculatedDiscount = basePrice * discountPercent / 100;
    } else if (discountType === 'fixed_amount') {
      calculatedDiscount = Math.min(discountAmount, basePrice); // Don't discount more than the price
    } else if (discountType === 'free_trial') {
      calculatedDiscount = basePrice; // Free trial = 100% discount
    }
  }

  const totalPrice = Math.max(0, basePrice - calculatedDiscount);

  // Calculate total licenses
  const totalLicenses = selectedPlan === '1' ? 1 : 5 + additionalLicenses;

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
    if (value === '1') {
      setAdditionalLicenses(0);
    }
  };

  const handleAdditionalLicensesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setAdditionalLicenses(Math.max(0, value));
  };

  const handleApplyDiscount = async () => {
    setIsApplyingDiscount(true);

    try {
      const response = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: discountCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setDiscountApplied(true);
        setDiscountPercent(data.discount_percent);
        setDiscountType(data.discount_type || 'percentage');
        setDiscountAmount(data.discount_amount || 0);
        setDiscountMessage(data.discount_message || `${data.discount_percent}% discount`);
        setDiscountCodeId(data.code_id);
        toast({
          title: "Discount applied!",
          description: data.discount_message || `${data.discount_percent}% discount has been applied to your order.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid discount code",
          description: data.message || "The discount code you entered is not valid.",
        });
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while validating the discount code.",
      });
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Generate a mock order ID for tracking purposes
      const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // If a discount code was applied, record the redemption
      if (discountApplied && discountCodeId) {
        try {
          await fetch('/api/record-discount-redemption', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              discount_code_id: discountCodeId,
              order_id: orderId
            }),
          });
        } catch (error) {
          console.error('Error recording discount code redemption:', error);
          // Continue with the process even if recording fails
        }
      }

      // In a real implementation, you would process the payment here
      // For now, we'll simulate a successful payment

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (discountApplied) {
        toast({
          title: "Success!",
          description: "Your account has been activated with the discount code.",
        });
      } else {
        toast({
          title: "Payment successful!",
          description: "Your account has been activated.",
        });
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="container mx-auto py-6 flex justify-between items-center">
        <Link href="/">
          <GonzigoBrand size="lg" className="h-10 flex items-center" />
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/auth/login">
            <Button variant="ghost" className="font-medium">Log in</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Get Started with Gonzigo</h1>
            <p className="text-xl text-gray-600 mb-6">The AI that remembers everything, so you don't have to.</p>
            <div className="flex justify-center space-x-2 mb-8">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <FaCheck className="mr-1 h-3 w-3" /> 14-day free trial
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <FaCheck className="mr-1 h-3 w-3" /> No credit card for trial
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Pricing Column */}
            <div className="md:col-span-2">
              <Card className="border-2 border-blue-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
                  <CardDescription>Select the number of licenses you need</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <RadioGroup
                    defaultValue="1"
                    className="space-y-4"
                    onValueChange={handlePlanChange}
                  >
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="single" />
                        <Label htmlFor="single" className="font-medium">Single License</Label>
                      </div>
                      <div className="font-bold">$30</div>
                    </div>
                    <div className="flex flex-col space-y-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="5" id="team" />
                          <Label htmlFor="team" className="font-medium">Team (5 Licenses)</Label>
                        </div>
                        <div className="font-bold">$100</div>
                      </div>

                      {selectedPlan === '5' && (
                        <div className="ml-6 mt-2 border-t pt-3">
                          <Label htmlFor="additionalLicenses" className="text-sm font-medium mb-1 block">
                            Additional Licenses ($10 each)
                          </Label>
                          <div className="flex items-center space-x-3">
                            <Input
                              id="additionalLicenses"
                              type="number"
                              min="0"
                              className="w-20"
                              value={additionalLicenses}
                              onChange={handleAdditionalLicensesChange}
                            />
                            <span className="text-sm text-gray-500">
                              {additionalLicenses > 0 ? `+$${additionalLicensesPrice}` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </RadioGroup>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Licenses:</span>
                      <span>{totalLicenses}</span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Base Price:</span>
                      <span>${basePlanPrice.toFixed(2)}</span>
                    </div>

                    {selectedPlan === '5' && additionalLicenses > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Additional Licenses:</span>
                        <span>+${additionalLicensesPrice.toFixed(2)}</span>
                      </div>
                    )}

                    {discountApplied && (
                      <div className="flex justify-between mb-2 text-green-600">
                        <span>Discount {discountMessage ? `(${discountMessage})` : ''}:</span>
                        <span>-${calculatedDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label htmlFor="discount">Discount Code</Label>
                    <div className="flex mt-1">
                      <Input
                        id="discount"
                        placeholder="Enter code"
                        className="rounded-r-none"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                      />
                      <Button
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount || !discountCode || discountApplied}
                        className="rounded-l-none bg-[#0047AB] hover:bg-[#003d91]"
                      >
                        {isApplyingDiscount ? "Applying..." : discountApplied ? "Applied" : "Apply"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form Column */}
            <div className="md:col-span-3">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="text-2xl">Payment Details</CardTitle>
                  <CardDescription>Complete your purchase securely</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="credit" className="mb-6" onValueChange={setPaymentMethod}>
                      <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="credit">Credit Card</TabsTrigger>
                        <TabsTrigger value="paypal">PayPal</TabsTrigger>
                      </TabsList>

                      <TabsContent value="credit">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cardName">Name on Card</Label>
                            <Input id="cardName" placeholder="John Smith" required />
                          </div>

                          <div>
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <div className="relative">
                              <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                                <FaCcVisa className="h-5 w-5 text-blue-600" />
                                <FaCcMastercard className="h-5 w-5 text-red-500" />
                                <FaCcAmex className="h-5 w-5 text-blue-400" />
                                <FaCcDiscover className="h-5 w-5 text-orange-500" />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input id="expiry" placeholder="MM/YY" required />
                            </div>
                            <div>
                              <Label htmlFor="cvc">CVC</Label>
                              <Input id="cvc" placeholder="123" required />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="paypal">
                        <div className="text-center py-8">
                          <p className="mb-4 text-gray-600">Click the button below to pay with PayPal</p>
                          <Button type="button" className="bg-[#0047AB] hover:bg-[#003d91]">
                            Continue with PayPal
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="space-y-4 border-t pt-6">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="your@email.com" required />
                      </div>

                      <div>
                        <Label htmlFor="company">Company Name (Optional)</Label>
                        <Input id="company" placeholder="Your Company" />
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button
                        type="submit"
                        className="w-full bg-[#0047AB] hover:bg-[#003d91] text-white py-6 text-lg"
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Processing..." : discountApplied ? "Activate Account" : `Pay $${totalPrice.toFixed(2)}`}
                      </Button>

                      <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                        <FaLock className="mr-2 h-4 w-4" />
                        <span>Secure payment processing</span>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
