import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { countries } from "@/lib/countries";
import { Upload } from "lucide-react";

// Form validation schema
const careerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  address: z.string().min(10, "Please enter a complete address"),
  highestQualification: z
    .string()
    .min(2, "Please enter your highest qualification"),
  specialization: z.string().min(2, "Please enter your specialization"),
  workExperience: z.string().min(1, "Please enter your work experience"),
  idNumber: z.string().min(1, "Please enter your valid ID number"),
  email: z.string().email("Please enter a valid email address"),
  country: z.string().min(1, "Please select your country"),
  phoneCode: z.string().min(1, "Please select a country code"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  whatsappCode: z.string().min(1, "Please select a country code"),
  whatsappNumber: z
    .string()
    .min(10, "WhatsApp number must be at least 10 digits"),
  message: z.string().min(10, "Please explain why you should be hired"),
  resume: z.any().optional(),
});

type CareerFormValues = z.infer<typeof careerFormSchema>;

export default function CareersPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, errors } =
    useForm<CareerFormValues>({
      resolver: zodResolver(careerFormSchema),
      defaultValues: {
        name: "",
        fatherName: "",
        maritalStatus: "Single",
        address: "",
        highestQualification: "",
        specialization: "",
        workExperience: "",
        idNumber: "",
        email: "",
        country: "",
        phoneCode: "+91",
        phoneNumber: "",
        whatsappCode: "+91",
        whatsappNumber: "",
        message: "",
      },
    });

  const onSubmit = async (data: CareerFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Add all fields to formData
      Object.entries(data).forEach(([key, value]) => {
        if (key === "phoneNumber") {
          formData.append("phone", `${data.phoneCode}${value}`);
        } else if (key === "whatsappNumber") {
          formData.append("whatsapp", `${data.whatsappCode}${value}`);
        } else if (key !== "phoneCode" && key !== "whatsappCode") {
          formData.append(key, value);
        }
      });

      const response = await fetch("/api/careers/submit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit application");
      }

      toast({
        title: "Application Submitted",
        description:
          "Thank you for applying! We will review your application and get back to you soon.",
      });

      // Reset form
      handleSubmit((values) => {
        // Reset all fields to default values
        Object.keys(values).forEach((key) => {
          if (key !== "phoneCode" && key !== "whatsappCode") {
            values[key] = "";
          }
        });
        return values;
      })();
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit your application. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Join Our Team</h1>
        <p className="text-gray-600">
          Kindly fill out the form below to apply for a position at Lelekart.
        </p>
      </div>

      <Form {...{ register, errors }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={register("name")}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={register("fatherName")}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter father's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={register("maritalStatus")}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={register("address")}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter your address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Education & Experience Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Education & Experience</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={register("highestQualification")}
                name="highestQualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highest Qualification</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your highest qualification"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={register("specialization")}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your specialization"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={register("workExperience")}
                name="workExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Work Experience</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter years of experience"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={register("idNumber")}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid ID Number (Aadhar/PAN)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your ID number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={register("email")}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <select
                    {...register("country")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    onChange={(e) => {
                      const selectedCountry = countries.find(
                        (c) => c.name === e.target.value
                      );
                      if (selectedCountry) {
                        setValue("phoneCode", selectedCountry.phoneCode);
                        setValue("whatsappCode", selectedCountry.phoneCode);
                      }
                    }}
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.country.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow">
                      <div className="absolute inset-y-0 left-0 flex items-center">
                        <span className="text-gray-500 sm:text-sm">
                          {watch("phoneCode") || "+91"}
                        </span>
                      </div>
                      <input
                        type="tel"
                        {...register("phoneNumber")}
                        className="block w-full rounded-md border-gray-300 pl-16 focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    WhatsApp Number
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow">
                      <div className="absolute inset-y-0 left-0 flex items-center">
                        <span className="text-gray-500 sm:text-sm">
                          {watch("whatsappCode") || "+91"}
                        </span>
                      </div>
                      <input
                        type="tel"
                        {...register("whatsappNumber")}
                        className="block w-full rounded-md border-gray-300 pl-16 focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Enter WhatsApp number"
                      />
                    </div>
                  </div>
                  {errors.whatsappNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.whatsappNumber.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resume Upload Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resume</h2>

            <FormField
              control={register("resume")}
              name="resume"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Upload Resume</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("resume-upload")?.click()
                        }
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload file
                      </Button>
                    </div>
                  </FormControl>
                  <p className="text-sm text-gray-500 mt-1">
                    Acceptable formats: .doc, .docx, .pdf
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Message Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why should you be hired for this role?
            </h2>

            <FormField
              control={register("message")}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Write your message here"
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
