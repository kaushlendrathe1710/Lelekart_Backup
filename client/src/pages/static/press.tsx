import React from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample press releases data (this would typically come from an API)
const pressReleases = [
  {
    id: 1,
    title: "Lelekart Raises $200M in Series E Funding Round",
    date: "January 15, 2023",
    category: "Financial News",
    excerpt:
      "The investment will fuel expansion into more tier 2 and tier 3 cities and strengthen the company's technology infrastructure.",
  },
  {
    id: 2,
    title: "Lelekart Launches Next-Day Delivery in 100+ Cities",
    date: "March 21, 2023",
    category: "Product Launch",
    excerpt:
      "The expansion of the company's delivery network marks a significant step in enhancing customer experience across India.",
  },
  {
    id: 3,
    title: "Lelekart Announces Seller Support Initiatives",
    date: "May 10, 2023",
    category: "Seller News",
    excerpt:
      "New programs include interest-free loans, logistics support, and specialized training to help small businesses scale on the platform.",
  },
  {
    id: 4,
    title: "Lelekart Reports 150% Growth in Rural Markets",
    date: "July 5, 2023",
    category: "Business Updates",
    excerpt:
      "Customer acquisition in rural areas has outpaced urban markets as e-commerce adoption accelerates across India.",
  },
  {
    id: 5,
    title: "Lelekart Introduces AI-Powered Shopping Assistant",
    date: "September 12, 2023",
    category: "Product Launch",
    excerpt:
      "The new feature uses advanced AI to provide personalized product recommendations and answer customer queries in real-time.",
  },
];

// Sample news coverage data
const mediaCoverage = [
  {
    id: 1,
    title: "How Lelekart is Revolutionizing E-commerce in India",
    publication: "Economic Times",
    date: "October 18, 2023",
    url: "#",
  },
  {
    id: 2,
    title: "Lelekart's Growth Strategy Pays Off with Record Sales",
    publication: "Business Standard",
    date: "September 30, 2023",
    url: "#",
  },
  {
    id: 3,
    title: "The Technology Behind Lelekart's Rapid Expansion",
    publication: "Tech Today",
    date: "August 25, 2023",
    url: "#",
  },
  {
    id: 4,
    title: "How Lelekart is Empowering Rural Entrepreneurs",
    publication: "India Business Journal",
    date: "July 14, 2023",
    url: "#",
  },
  {
    id: 5,
    title: "Lelekart Named Among Top 10 Most Innovative Companies",
    publication: "Innovation Magazine",
    date: "June 5, 2023",
    url: "#",
  },
];

export default function PressPage() {
  return (
    <div className="bg-[#f1f3f6] min-h-screen py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-white shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Press</h1>
              <p className="text-lg md:text-xl mb-6">
                News, updates and media resources from Lelekart
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <StaticPageSection
                section="press_page"
                titleFilter="Press Intro"
                defaultContent={
                  <div className="mb-8 text-gray-700">
                    <p className="text-lg">
                      Welcome to Lelekart's press section. Here you'll find our
                      latest company news, press releases, media resources, and
                      contact information for press inquiries. For additional
                      information or media requests, please reach out to our
                      press team.
                    </p>
                  </div>
                }
              />

              {/* Press Contacts */}
              <div className="mb-10">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-blue-800 mb-2">
                        Press Contact
                      </h3>
                      <StaticPageSection
                        section="press_page"
                        titleFilter="Press Contact"
                        defaultContent={
                          <div className="text-blue-700">
                            <p className="mb-1">
                              For press inquiries, please contact:
                            </p>
                            <p className="font-medium">
                              media-relations@lelekart.com
                            </p>
                            <p>+91 80 1234 5678</p>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Button>Download Press Kit</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Press Releases */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Latest Press Releases
                </h2>
                <div className="space-y-6">
                  <StaticPageSection
                    section="press_page"
                    titleFilter="Press Releases"
                    defaultContent={
                      <>
                        {pressReleases.slice(0, 3).map((release) => (
                          <Card
                            key={release.id}
                            className="border-[#efefef] hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <Calendar size={16} className="mr-2" />
                                <span>{release.date}</span>
                                <span className="mx-2">•</span>
                                <span className="text-blue-600">
                                  {release.category}
                                </span>
                              </div>
                              <h3 className="text-xl font-semibold mb-2 hover:text-blue-600 transition-colors">
                                <a href="#">{release.title}</a>
                              </h3>
                              <p className="text-gray-600 mb-4">
                                {release.excerpt}
                              </p>
                              <Button
                                variant="link"
                                className="p-0 h-auto text-[#2874f0]"
                              >
                                Read Full Release
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        <div className="flex justify-center mt-8">
                          <Button variant="outline">
                            View All Press Releases
                          </Button>
                        </div>
                      </>
                    }
                  />
                </div>
              </div>

              <Separator className="my-10" />

              {/* Media Coverage */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Media Coverage
                </h2>
                <div className="space-y-4">
                  <StaticPageSection
                    section="press_page"
                    titleFilter="Media Coverage"
                    defaultContent={
                      <>
                        {mediaCoverage.map((article) => (
                          <div
                            key={article.id}
                            className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-gray-100"
                          >
                            <div>
                              <h3 className="text-lg font-medium hover:text-blue-600 transition-colors">
                                <a href={article.url}>{article.title}</a>
                              </h3>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Globe size={14} className="mr-2" />
                                <span>{article.publication}</span>
                                <span className="mx-2">•</span>
                                <span>{article.date}</span>
                              </div>
                            </div>
                            <Button
                              variant="link"
                              className="mt-2 md:mt-0"
                              size="sm"
                            >
                              Read Article
                            </Button>
                          </div>
                        ))}
                      </>
                    }
                  />
                </div>
              </div>

              {/* Media Resources */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Media Resources
                </h2>
                <Tabs defaultValue="logos" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="logos">Brand Logos</TabsTrigger>
                    <TabsTrigger value="images">Product Images</TabsTrigger>
                    <TabsTrigger value="kits">Media Kits</TabsTrigger>
                  </TabsList>
                  <TabsContent value="logos">
                    <StaticPageSection
                      section="press_page"
                      titleFilter="Brand Logos"
                      defaultContent={
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <div className="text-2xl font-bold text-[#2874f0]">
                                  Lelekart Logo
                                </div>
                              </div>
                              <h3 className="font-medium mb-2">
                                Primary Logo (Full Color)
                              </h3>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  PNG
                                </Button>
                                <Button size="sm" variant="outline">
                                  SVG
                                </Button>
                                <Button size="sm" variant="outline">
                                  EPS
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-800 flex items-center justify-center mb-4 rounded">
                                <div className="text-2xl font-bold text-white">
                                  Lelekart Logo
                                </div>
                              </div>
                              <h3 className="font-medium mb-2">
                                White Version (For Dark Backgrounds)
                              </h3>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  PNG
                                </Button>
                                <Button size="sm" variant="outline">
                                  SVG
                                </Button>
                                <Button size="sm" variant="outline">
                                  EPS
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <div className="text-2xl font-bold text-gray-800">
                                  L
                                </div>
                              </div>
                              <h3 className="font-medium mb-2">
                                Logo Mark Only
                              </h3>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  PNG
                                </Button>
                                <Button size="sm" variant="outline">
                                  SVG
                                </Button>
                                <Button size="sm" variant="outline">
                                  EPS
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      }
                    />
                  </TabsContent>
                  <TabsContent value="images">
                    <StaticPageSection
                      section="press_page"
                      titleFilter="Product Images"
                      defaultContent={
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <FileText size={36} className="text-gray-400" />
                              </div>
                              <h3 className="font-medium mb-2">
                                Mobile App Screenshots
                              </h3>
                              <Button size="sm" variant="outline">
                                Download ZIP
                              </Button>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <FileText size={36} className="text-gray-400" />
                              </div>
                              <h3 className="font-medium mb-2">
                                Website Interface
                              </h3>
                              <Button size="sm" variant="outline">
                                Download ZIP
                              </Button>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <FileText size={36} className="text-gray-400" />
                              </div>
                              <h3 className="font-medium mb-2">
                                Delivery Network Photos
                              </h3>
                              <Button size="sm" variant="outline">
                                Download ZIP
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      }
                    />
                  </TabsContent>
                  <TabsContent value="kits">
                    <StaticPageSection
                      section="press_page"
                      titleFilter="Media Kits"
                      defaultContent={
                        <div className="space-y-4">
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold mb-1">
                                    Company Fact Sheet
                                  </h3>
                                  <p className="text-gray-600">
                                    Key information about Lelekart, including
                                    company history, leadership, and key metrics
                                  </p>
                                </div>
                                <Button>Download</Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold mb-1">
                                    Executive Biographies
                                  </h3>
                                  <p className="text-gray-600">
                                    Profiles and professional photos of
                                    Lelekart's leadership team
                                  </p>
                                </div>
                                <Button>Download</Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold mb-1">
                                    Complete Press Kit
                                  </h3>
                                  <p className="text-gray-600">
                                    Comprehensive set of resources including
                                    logos, photos, fact sheets, and more
                                  </p>
                                </div>
                                <Button>Download</Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      }
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <StaticPageSection
                section="press_page"
                titleFilter="Press Footer"
                defaultContent={
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-semibold mb-4">Stay Updated</h3>
                    <p className="text-gray-600 max-w-3xl mx-auto mb-6">
                      Subscribe to our press list to receive the latest news and
                      updates from Lelekart directly to your inbox.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                      <Button size="lg">Subscribe to Press Updates</Button>
                      <Button size="lg" variant="outline">
                        Contact Press Team
                      </Button>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
