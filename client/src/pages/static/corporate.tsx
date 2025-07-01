import React from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building,
  Briefcase,
  Users,
  TrendingUp,
  Globe,
  Award,
  BarChart3,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function CorporateInfoPage() {
  const [, navigate] = useLocation();
  const [showInvestor, setShowInvestor] = React.useState(false);

  // Helper for PDF download
  function downloadPDF(filename: string) {
    const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 60 >>\nstream\nBT /F1 18 Tf 100 700 Td (${filename}) Tj ET\nBT /F1 10 Tf 100 680 Td (Lelekart Internet Private Limited) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000178 00000 n \n0000000297 00000 n \ntrailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n406\n%%EOF`;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  return (
    <div className="bg-[#f1f3f6] min-h-screen py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-white shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Corporate Information
              </h1>
              <p className="text-lg md:text-xl mb-6">
                About Lelekart Internet Private Limited
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <StaticPageSection
                section="corporate_page"
                titleFilter="Corporate Intro"
                defaultContent={
                  <div className="mb-10 text-gray-700">
                    <p className="text-lg mb-4">
                      Lelekart Internet Private Limited is India's leading
                      e-commerce marketplace, offering a diverse selection of
                      products across categories from electronics to fashion,
                      home goods to groceries. Founded in 2023, we've grown into
                      one of India's largest online retailers, serving millions
                      of customers nationwide.
                    </p>
                    <p className="text-lg">
                      Our mission is to provide customers with the widest
                      selection of products at competitive prices, delivered
                      with exceptional service. For our sellers, we offer a
                      powerful platform to reach customers across India,
                      supported by sophisticated tools and logistics
                      infrastructure to help their businesses grow.
                    </p>
                  </div>
                }
              />

              {/* Company Overview */}
              <Card className="border-[#efefef] mb-10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                    Company Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                    <StaticPageSection
                      section="corporate_page"
                      titleFilter="Company Overview 1"
                      defaultContent={
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <Building className="h-5 w-5 text-[#2874f0] mt-1 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold mb-1">Legal Name</h3>
                              <p className="text-gray-600">
                                Lelekart Internet Private Limited
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Briefcase className="h-5 w-5 text-[#2874f0] mt-1 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold mb-1">Industry</h3>
                              <p className="text-gray-600">
                                E-commerce, Retail, Technology
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Globe className="h-5 w-5 text-[#2874f0] mt-1 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold mb-1">
                                Headquarters
                              </h3>
                              <p className="text-gray-600">
                                Bengaluru, Karnataka, India
                              </p>
                            </div>
                          </div>
                        </div>
                      }
                    />
                    <StaticPageSection
                      section="corporate_page"
                      titleFilter="Company Overview 2"
                      defaultContent={
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <Users className="h-5 w-5 text-[#2874f0] mt-1 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold mb-1">Employees</h3>
                              <p className="text-gray-600">
                                14,000+ employees across India
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <TrendingUp className="h-5 w-5 text-[#2874f0] mt-1 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold mb-1">Founded</h3>
                              <p className="text-gray-600">2023</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Award className="h-5 w-5 text-[#2874f0] mt-1 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold mb-1">
                                Recognition
                              </h3>
                              <p className="text-gray-600">
                                Ranked among India's Most Trusted E-commerce
                                Brands
                              </p>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Key Metrics
                </h2>
                <StaticPageSection
                  section="corporate_page"
                  titleFilter="Key Metrics"
                  defaultContent={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow text-center">
                        <CardContent className="p-5">
                          <div className="mx-auto bg-[#2874f0]/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                            <Users size={28} className="text-[#2874f0]" />
                          </div>
                          <p className="text-3xl font-bold mb-2 text-[#2874f0]">
                            400M+
                          </p>
                          <h3 className="text-lg font-medium mb-1">
                            Registered Customers
                          </h3>
                          <p className="text-gray-600 text-sm">Across India</p>
                        </CardContent>
                      </Card>
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow text-center">
                        <CardContent className="p-5">
                          <div className="mx-auto bg-[#2874f0]/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                            <Briefcase size={28} className="text-[#2874f0]" />
                          </div>
                          <p className="text-3xl font-bold mb-2 text-[#2874f0]">
                            300K+
                          </p>
                          <h3 className="text-lg font-medium mb-1">Sellers</h3>
                          <p className="text-gray-600 text-sm">
                            From SMBs to large brands
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow text-center">
                        <CardContent className="p-5">
                          <div className="mx-auto bg-[#2874f0]/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                            <BarChart3 size={28} className="text-[#2874f0]" />
                          </div>
                          <p className="text-3xl font-bold mb-2 text-[#2874f0]">
                            100M+
                          </p>
                          <h3 className="text-lg font-medium mb-1">Products</h3>
                          <p className="text-gray-600 text-sm">
                            Across 80+ categories
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  }
                />
              </div>

              {/* Leadership */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Leadership
                </h2>
                <StaticPageSection
                  section="corporate_page"
                  titleFilter="Leadership"
                  defaultContent={
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto mb-4 overflow-hidden">
                          <img
                            src="https://static-assets-web.flixcart.com/fk-sp-static/images/CEO_profile.png"
                            alt="CEO"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold">Rahul Sharma</h3>
                        <p className="text-sm text-gray-600">CEO</p>
                      </div>
                      <div className="text-center">
                        <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto mb-4 overflow-hidden">
                          <img
                            src="https://static-assets-web.flixcart.com/fk-sp-static/images/CTO_profile.png"
                            alt="CTO"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold">Priya Patel</h3>
                        <p className="text-sm text-gray-600">CTO</p>
                      </div>
                      <div className="text-center">
                        <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto mb-4 overflow-hidden">
                          <img
                            src="https://static-assets-web.flixcart.com/fk-sp-static/images/COO_profile.png"
                            alt="COO"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold">Amit Kumar</h3>
                        <p className="text-sm text-gray-600">COO</p>
                      </div>
                      <div className="text-center">
                        <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto mb-4 overflow-hidden">
                          <img
                            src="https://static-assets-web.flixcart.com/fk-sp-static/images/CFO_profile.png"
                            alt="CFO"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold">Deepa Agarwal</h3>
                        <p className="text-sm text-gray-600">CFO</p>
                      </div>
                    </div>
                  }
                />
              </div>

              <Separator className="my-8" />

              {/* Corporate Addresses */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Corporate Addresses
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StaticPageSection
                    section="corporate_page"
                    titleFilter="Headquarters"
                    defaultContent={
                      <Card className="border-[#efefef] h-full">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-3">
                            Headquarters
                          </h3>
                          <div className="flex items-start">
                            <Building className="h-5 w-5 text-[#2874f0] mt-1 mr-3 flex-shrink-0" />
                            <div className="text-gray-600">
                              <p>Lelekart Internet Private Limited</p>
                              <p>Buildings Alyssa, Begonia &</p>
                              <p>Clove Embassy Tech Village</p>
                              <p>Outer Ring Road, Devarabeesanahalli Village</p>
                              <p>Bengaluru, 560103</p>
                              <p>Karnataka, India</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    }
                  />
                  <StaticPageSection
                    section="corporate_page"
                    titleFilter="Registered Office"
                    defaultContent={
                      <Card className="border-[#efefef] h-full">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-3">
                            Registered Office
                          </h3>
                          <div className="flex items-start">
                            <Building className="h-5 w-5 text-[#2874f0] mt-1 mr-3 flex-shrink-0" />
                            <div className="text-gray-600">
                              <p>Lelekart Internet Private Limited</p>
                              <p>Vaishnavi Summit, Ground Floor</p>
                              <p>7th Main, 80 Feet Road, 3rd Block</p>
                              <p>Koramangala</p>
                              <p>Bengaluru, 560034</p>
                              <p>Karnataka, India</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    }
                  />
                </div>
              </div>

              {/* Company Documents */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Corporate Documents
                </h2>
                <StaticPageSection
                  section="corporate_page"
                  titleFilter="Documents"
                  defaultContent={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                Annual Report 2023
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                PDF, 5.2 MB
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => downloadPDF('Annual-Report-2023.pdf')}>
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                Investor Presentation
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                PDF, 3.8 MB
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => downloadPDF('Investor-Presentation.pdf')}>
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                Corporate Factsheet
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                PDF, 1.5 MB
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => downloadPDF('Corporate-Factsheet.pdf')}>
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  }
                />
              </div>

              <StaticPageSection
                section="corporate_page"
                titleFilter="Corporate Footer"
                defaultContent={
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-semibold mb-4">
                      Investor Relations
                    </h3>
                    <p className="text-gray-600 max-w-3xl mx-auto mb-6">
                      For investor relations inquiries, please contact our
                      Investor Relations team at investor.relations@lelekart.com
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                      <Button onClick={() => setShowInvestor(true)}>Investor Relations</Button>
                      <Button variant="outline" onClick={() => navigate('/press')}>Press Room</Button>
                      <Button variant="outline" onClick={() => navigate('/careers')}>Careers</Button>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
      {showInvestor && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4">Investor Relations</h2>
            <p className="mb-2">Email: <a href="mailto:investor.relations@lelekart.com" className="text-blue-700 underline">investor.relations@lelekart.com</a></p>
            <Button onClick={() => setShowInvestor(false)} className="mt-2">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
