'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, FileText } from "lucide-react";
import Link from "next/link";

// Dummy data for demo purposes
const recentQuotes = [
  { id: 1, client: "John Smith", type: "Auto", status: "Pending", date: "2023-10-15" },
  { id: 2, client: "Emma Johnson", type: "Home", status: "Completed", date: "2023-10-12" },
  { id: 3, client: "Michael Brown", type: "Specialty", status: "In Progress", date: "2023-10-10" },
];

const stats = [
  {
    title: "Total Quotes",
    value: "254",
    description: "All time quotes created",
    change: "+12% from last month",
    icon: FileText,
    positive: true
  },
  {
    title: "Active Clients",
    value: "128",
    description: "Clients with active quotes",
    change: "+4% from last month",
    icon: Users,
    positive: true
  },
  {
    title: "Quotes This Month",
    value: "32",
    description: "New quotes created in October",
    change: "-5% from last month",
    icon: BarChart3,
    positive: false
  },
];

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-2 sm:p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Welcome</h1>
            <p className="text-muted-foreground">The pipeline whisperer is ready to help you close more deals</p>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link href="/dashboard/new">
                New Lead
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, i) => (
            <Card key={i} className="overflow-hidden border-border hover:border-border/80 hover:shadow-md transition-all duration-200 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  stat.positive ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                }`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <p className={`text-xs font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-2 sm:p-4 pt-0">
        <Card className="border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden bg-card h-full">
          <CardHeader className="bg-muted/50 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Recent Quote Requests</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your most recent quote requests from the last 30 days
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-primary border-border hover:bg-accent">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((quote) => (
                    <tr key={quote.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">{quote.client}</td>
                      <td className="py-4 px-4 text-muted-foreground">{quote.type}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          quote.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : quote.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-primary/10 text-primary'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{quote.date}</td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-primary hover:text-primary/80 hover:bg-primary/10 font-medium"
                        >
                          <Link href={`/dashboard/quotes/${quote.id}`}>View Details</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border bg-muted/30">
            <Button variant="outline" size="sm" className="text-muted-foreground border-border hover:bg-background">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="text-muted-foreground border-border hover:bg-background">
              Next
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}