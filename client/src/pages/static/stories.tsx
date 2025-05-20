import React from 'react';
import { StaticPageTemplate, StaticPageSection } from '@/components/static-page-template';
import { 
  Card, 
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User } from 'lucide-react';

// Sample stories data (this would typically come from an API)
const successStories = [
  {
    id: 1,
    title: "From Local Artisan to National Brand",
    category: "Seller Success",
    image: "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/fashion-img.png",
    date: "April 5, 2023",
    author: "Team Lelekart",
    excerpt: "How a small handicraft business from Rajasthan grew to serve customers nationwide through Lelekart's platform.",
    featured: true,
  },
  {
    id: 2,
    title: "Building the Future of E-commerce Logistics",
    category: "Innovation",
    image: "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/grocery-img.png",
    date: "March 12, 2023",
    author: "Tech Team",
    excerpt: "Inside Lelekart's revolutionary approach to solving India's complex delivery challenges.",
    featured: true,
  },
  {
    id: 3,
    title: "Empowering Women Entrepreneurs",
    category: "Seller Success",
    image: "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/beauty-img.png",
    date: "February 28, 2023",
    author: "Seller Relations",
    excerpt: "How our dedicated programs are helping women business owners thrive in the digital marketplace.",
    featured: false,
  },
  {
    id: 4,
    title: "AI-Powered Shopping Recommendations",
    category: "Innovation",
    image: "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/mobile-img.png",
    date: "January 17, 2023",
    author: "AI Team",
    excerpt: "The technology behind our personalized shopping experience that helps customers discover products they'll love.",
    featured: false,
  },
  {
    id: 5,
    title: "Bringing the Internet to Rural India",
    category: "Social Impact",
    image: "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/home-img.png",
    date: "December 15, 2022",
    author: "CSR Team",
    excerpt: "Our initiatives to bridge the digital divide and make e-commerce accessible to everyone in India.",
    featured: false,
  },
  {
    id: 6,
    title: "Sustainable Packaging Revolution",
    category: "Social Impact",
    image: "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/electronics-img.png",
    date: "November 6, 2022",
    author: "Sustainability Team",
    excerpt: "How we're reducing our environmental footprint with innovative packaging solutions.",
    featured: false,
  },
];

export default function StoriesPage() {
  return (
    <StaticPageTemplate 
      title="Lelekart Stories" 
      subtitle="Discover innovations, seller success stories, and social impact initiatives"
    >
      <StaticPageSection 
        section="stories_page"
        titleFilter="Stories Intro" 
        defaultContent={
          <div className="mb-10 text-gray-700">
            <p className="text-lg">
              At Lelekart, we're building more than just an e-commerce platform - we're creating opportunities, 
              driving innovation, and making a positive impact across India. Through Lelekart Stories, we share the 
              journeys of sellers who've transformed their businesses, the technologies reshaping online shopping, 
              and the initiatives that are making a difference in communities.
            </p>
          </div>
        }
      />
      
      {/* Featured Stories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">Featured Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StaticPageSection 
            section="stories_page"
            titleFilter="Featured Stories" 
            defaultContent={
              <>
                {successStories.filter(story => story.featured).map((story) => (
                  <Card key={story.id} className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow">
                    <div className="relative h-48 w-full bg-gray-100">
                      <img 
                        src={story.image} 
                        alt={story.title} 
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#2874f0] text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {story.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-xl font-semibold mb-2">{story.title}</h3>
                      <p className="text-gray-600 mb-3">{story.excerpt}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="flex items-center mr-4">
                          <Clock size={14} className="mr-1" />
                          <span>{story.date}</span>
                        </div>
                        <div className="flex items-center">
                          <User size={14} className="mr-1" />
                          <span>{story.author}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-5 pt-0">
                      <Button variant="link" className="p-0 h-auto text-[#2874f0]">
                        Read Full Story
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </>
            }
          />
        </div>
      </div>
      
      {/* All Stories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">Explore All Stories</h2>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="seller">Seller Success</TabsTrigger>
            <TabsTrigger value="innovation">Innovation</TabsTrigger>
            <TabsTrigger value="impact">Social Impact</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StaticPageSection 
                section="stories_page"
                titleFilter="All Stories" 
                defaultContent={
                  <>
                    {successStories.map((story) => (
                      <Card key={story.id} className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow">
                        <div className="relative h-40 w-full bg-gray-100">
                          <img 
                            src={story.image} 
                            alt={story.title} 
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="bg-[#2874f0] text-white text-xs font-semibold px-3 py-1 rounded-full">
                              {story.category}
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">{story.excerpt}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="flex items-center mr-3">
                              <Clock size={12} className="mr-1" />
                              <span>{story.date}</span>
                            </div>
                            <div className="flex items-center">
                              <User size={12} className="mr-1" />
                              <span>{story.author}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                          <Button variant="link" className="p-0 h-auto text-sm text-[#2874f0]">
                            Read More
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </>
                }
              />
            </div>
          </TabsContent>
          <TabsContent value="seller">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StaticPageSection 
                section="stories_page"
                titleFilter="Seller Stories" 
                defaultContent={
                  <>
                    {successStories
                      .filter(story => story.category === "Seller Success")
                      .map((story) => (
                        <Card key={story.id} className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow">
                          <div className="relative h-40 w-full bg-gray-100">
                            <img 
                              src={story.image} 
                              alt={story.title} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">{story.excerpt}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <div className="flex items-center mr-3">
                                <Clock size={12} className="mr-1" />
                                <span>{story.date}</span>
                              </div>
                              <div className="flex items-center">
                                <User size={12} className="mr-1" />
                                <span>{story.author}</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button variant="link" className="p-0 h-auto text-sm text-[#2874f0]">
                              Read More
                            </Button>
                          </CardFooter>
                        </Card>
                    ))}
                  </>
                }
              />
            </div>
          </TabsContent>
          <TabsContent value="innovation">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StaticPageSection 
                section="stories_page"
                titleFilter="Innovation Stories" 
                defaultContent={
                  <>
                    {successStories
                      .filter(story => story.category === "Innovation")
                      .map((story) => (
                        <Card key={story.id} className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow">
                          <div className="relative h-40 w-full bg-gray-100">
                            <img 
                              src={story.image} 
                              alt={story.title} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">{story.excerpt}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <div className="flex items-center mr-3">
                                <Clock size={12} className="mr-1" />
                                <span>{story.date}</span>
                              </div>
                              <div className="flex items-center">
                                <User size={12} className="mr-1" />
                                <span>{story.author}</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button variant="link" className="p-0 h-auto text-sm text-[#2874f0]">
                              Read More
                            </Button>
                          </CardFooter>
                        </Card>
                    ))}
                  </>
                }
              />
            </div>
          </TabsContent>
          <TabsContent value="impact">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StaticPageSection 
                section="stories_page"
                titleFilter="Impact Stories" 
                defaultContent={
                  <>
                    {successStories
                      .filter(story => story.category === "Social Impact")
                      .map((story) => (
                        <Card key={story.id} className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow">
                          <div className="relative h-40 w-full bg-gray-100">
                            <img 
                              src={story.image} 
                              alt={story.title} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">{story.excerpt}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <div className="flex items-center mr-3">
                                <Clock size={12} className="mr-1" />
                                <span>{story.date}</span>
                              </div>
                              <div className="flex items-center">
                                <User size={12} className="mr-1" />
                                <span>{story.author}</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button variant="link" className="p-0 h-auto text-sm text-[#2874f0]">
                              Read More
                            </Button>
                          </CardFooter>
                        </Card>
                    ))}
                  </>
                }
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <StaticPageSection 
        section="stories_page"
        titleFilter="Stories Footer" 
        defaultContent={
          <div className="text-center mt-10">
            <h3 className="text-xl font-semibold mb-4">Share Your Story</h3>
            <p className="text-gray-600 max-w-3xl mx-auto mb-6">
              Are you a seller with a success story? Or have you experienced something remarkable as a Lelekart customer? We'd love to hear from you!
            </p>
            <Button size="lg">Submit Your Story</Button>
          </div>
        }
      />
    </StaticPageTemplate>
  );
}