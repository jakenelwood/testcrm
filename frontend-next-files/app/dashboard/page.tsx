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
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            asChild
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Link href="/dashboard/new">
              New Lead
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
            <CardFooter>
              <p className={`text-xs ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Quote Requests</CardTitle>
          <CardDescription>
            Your most recent quote requests from the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Client</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="border-b last:border-b-0">
                    <td className="py-3 px-4">{quote.client}</td>
                    <td className="py-3 px-4">{quote.type}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                        quote.status === 'Completed'
                          ? 'bg-green-50 text-green-700'
                          : quote.status === 'Pending'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-blue-50 text-blue-700'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{quote.date}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/quotes/${quote.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}