import React from 'react';
import { StaticPageTemplate, StaticPageSection } from '@/components/static-page-template';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Globe, 
  Award,
  BookOpen,
  Briefcase,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Sample job data (this would typically come from an API)
const jobOpenings = [
  {
    id: 1,
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "Bangalore, India",
    type: "Full-time",
    description: "We're looking for an experienced software engineer to join our growing tech team. You'll be working on building and maintaining core e-commerce systems."
  },
  {
    id: 2,
    title: "UX Designer",
    department: "Design",
    location: "Bangalore, India",
    type: "Full-time",
    description: "Join our design team to craft intuitive and delightful user experiences that millions of customers interact with daily."
  },
  {
    id: 3,
    title: "Product Manager",
    department: "Product",
    location: "Bangalore, India",
    type: "Full-time",
    description: "Drive product strategy and execution for key e-commerce initiatives that impact our customers and business metrics."
  },
  {
    id: 4,
    title: "Data Analyst",
    department: "Analytics",
    location: "Bangalore, India",
    type: "Full-time",
    description: "Help us make data-driven decisions by analyzing customer behaviors, trends, and business metrics across our platform."
  },
];

export default function CareersPage() {
  return (
    <StaticPageTemplate 
      title="Careers at Lelekart" 
      subtitle="Join us in revolutionizing e-commerce in India"
    >
      <StaticPageSection 
        section="careers_page"
        titleFilter="Careers Intro" 
        defaultContent={
          <div className="mb-8 text-gray-700">
            <p className="text-lg mb-4">
              At Lelekart, we're building India's most customer-centric e-commerce platform. Our mission is to provide customers with the widest selection of products at great prices with a convenient and reliable shopping experience.
            </p>
            <p className="text-lg">
              We're looking for passionate, talented people to join our team and help shape the future of e-commerce in India. If you're excited about building products that impact millions of users, we'd love to hear from you!
            </p>
          </div>
        }
      />
      
      {/* Why Join Us */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">Why Join Lelekart?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StaticPageSection 
            section="careers_page"
            titleFilter="Why Join Us" 
            defaultContent={
              <>
                <Card className="border-[#efefef] hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="bg-[#2874f0]/10 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                      <TrendingUp size={24} className="text-[#2874f0]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Rapid Growth</h3>
                    <p className="text-gray-600">
                      Be part of one of India's fastest-growing e-commerce companies and build your career in a dynamic environment with endless opportunities.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-[#efefef] hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="bg-[#2874f0]/10 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                      <Users size={24} className="text-[#2874f0]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Talented Team</h3>
                    <p className="text-gray-600">
                      Collaborate with some of the brightest minds in the industry who are passionate about solving challenging problems and innovating together.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-[#efefef] hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="bg-[#2874f0]/10 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                      <Globe size={24} className="text-[#2874f0]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Meaningful Impact</h3>
                    <p className="text-gray-600">
                      Your work will directly impact millions of customers and thousands of sellers across India, helping transform how India shops online.
                    </p>
                  </CardContent>
                </Card>
              </>
            }
          />
        </div>
      </div>
      
      {/* Our Values */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StaticPageSection 
            section="careers_page"
            titleFilter="Our Values" 
            defaultContent={
              <>
                <div className="flex items-start mb-4">
                  <div className="bg-[#2874f0]/10 w-10 h-10 flex items-center justify-center rounded-full mr-4 flex-shrink-0">
                    <Award size={20} className="text-[#2874f0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Customer Obsession</h3>
                    <p className="text-gray-600">We put customers first in everything we do, focusing on delighting them and earning their trust.</p>
                  </div>
                </div>
                <div className="flex items-start mb-4">
                  <div className="bg-[#2874f0]/10 w-10 h-10 flex items-center justify-center rounded-full mr-4 flex-shrink-0">
                    <TrendingUp size={20} className="text-[#2874f0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Bias for Action</h3>
                    <p className="text-gray-600">We value calculated risk-taking, quick decisions, and proactive solutions over slow, risk-averse approaches.</p>
                  </div>
                </div>
              </>
            }
          />
          <StaticPageSection 
            section="careers_page"
            titleFilter="Our Values 2" 
            defaultContent={
              <>
                <div className="flex items-start mb-4">
                  <div className="bg-[#2874f0]/10 w-10 h-10 flex items-center justify-center rounded-full mr-4 flex-shrink-0">
                    <BookOpen size={20} className="text-[#2874f0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Learn & Be Curious</h3>
                    <p className="text-gray-600">We're never done learning and always seek to improve ourselves. We're curious about new possibilities and act to explore them.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-[#2874f0]/10 w-10 h-10 flex items-center justify-center rounded-full mr-4 flex-shrink-0">
                    <Users size={20} className="text-[#2874f0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Ownership & Bias for Results</h3>
                    <p className="text-gray-600">We act on behalf of the entire company, beyond just our own teams. We never say "that's not my job."</p>
                  </div>
                </div>
              </>
            }
          />
        </div>
      </div>
      
      {/* Current Openings */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">Current Openings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StaticPageSection 
            section="careers_page"
            titleFilter="Job Openings" 
            defaultContent={
              <>
                {jobOpenings.map((job) => (
                  <Card key={job.id} className="mb-4 border-[#efefef] hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                      <div className="flex flex-wrap items-center mb-3 text-sm text-gray-600">
                        <div className="flex items-center mr-4 mb-2">
                          <Building size={16} className="mr-1" />
                          <span>{job.department}</span>
                        </div>
                        <div className="flex items-center mr-4 mb-2">
                          <Globe size={16} className="mr-1" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          <Briefcase size={16} className="mr-1" />
                          <span>{job.type}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{job.description}</p>
                      <Button variant="default">Apply Now</Button>
                    </CardContent>
                  </Card>
                ))}
              </>
            }
          />
        </div>
      </div>
      
      {/* Benefits */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">Benefits & Perks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <StaticPageSection 
            section="careers_page"
            titleFilter="Benefits" 
            defaultContent={
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2874f0] mr-3"></div>
                  <p className="text-gray-700">Competitive compensation packages</p>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2874f0] mr-3"></div>
                  <p className="text-gray-700">Health insurance for you and your family</p>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2874f0] mr-3"></div>
                  <p className="text-gray-700">Flexible work arrangements</p>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2874f0] mr-3"></div>
                  <p className="text-gray-700">Employee stock options</p>
                </div>
              </div>
            }
          />
          <StaticPageSection 
            section="careers_page"
            titleFilter="Perks" 
            defaultContent={
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2874f0] mr-3"></div>
                  <p className="text-gray-700">Learning & development opportunities</p>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2874f0] mr-3"></div>
                  <p className="text-gray-700">Regular team outings and events</p>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2874f0] mr-3"></div>
                  <p className="text-gray-700">Employee discounts on Lelekart products</p>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2874f0] mr-3"></div>
                  <p className="text-gray-700">Casual dress code and relaxed work environment</p>
                </div>
              </div>
            }
          />
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <StaticPageSection 
        section="careers_page"
        titleFilter="Careers Footer" 
        defaultContent={
          <div className="text-center mt-6">
            <h3 className="text-xl font-semibold mb-4">Join Our Team</h3>
            <p className="text-gray-600 max-w-3xl mx-auto mb-6">
              We're always looking for talented individuals who are passionate about e-commerce and technology. Even if you don't see a suitable position listed above, feel free to send us your resume.
            </p>
            <Button size="lg">View All Job Openings</Button>
          </div>
        }
      />
    </StaticPageTemplate>
  );
}