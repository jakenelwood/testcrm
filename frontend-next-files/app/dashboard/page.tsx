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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Welcome</h1>
          <p className="text-gray-500">The pipeline whisperer is ready to help you close more deals</p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="bg-black hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Link href="/dashboard/new">
              New Lead
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="overflow-hidden border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                stat.positive ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
            <CardFooter className="pt-0">
              <p className={`text-xs font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Recent Quote Requests</CardTitle>
              <CardDescription className="text-gray-500">
                Your most recent quote requests from the last 30 days
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900">{quote.client}</td>
                    <td className="py-4 px-4 text-gray-600">{quote.type}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        quote.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : quote.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{quote.date}</td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
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
        <CardFooter className="flex justify-between border-t border-gray-100 bg-gray-50">
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-white">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-white">
            Next
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}