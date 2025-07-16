import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PLATFORM_OPTIONS = ["Twitter", "Instagram", "Facebook", "Custom"];

const fetchAffiliates = async () => {
  const res = await fetch("/api/admin/affiliates");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};
const addAffiliate = async (data: any) => {
  const res = await fetch("/api/admin/affiliates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add");
  return res.json();
};
const updateAffiliate = async (data: any) => {
  const res = await fetch(`/api/admin/affiliates/${data.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
};
const deleteAffiliate = async (id: number) => {
  const res = await fetch(`/api/admin/affiliates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
};

export default function AffiliateMarketingPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["affiliates"],
    queryFn: fetchAffiliates,
  });
  const addMutation = useMutation({
    mutationFn: addAffiliate,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["affiliates"] }),
  });
  const updateMutation = useMutation({
    mutationFn: updateAffiliate,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["affiliates"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAffiliate,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["affiliates"] }),
  });

  // Add form state
  const [form, setForm] = useState({ name: "", platform: "", code: "" });
  const [formPlatformType, setFormPlatformType] = useState(PLATFORM_OPTIONS[0]);
  // Edit form state
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    platform: "",
    code: "",
  });
  const [editPlatformType, setEditPlatformType] = useState(PLATFORM_OPTIONS[0]);
  const [showForm, setShowForm] = useState(false);

  // Add form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handlePlatformTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFormPlatformType(e.target.value);
    if (e.target.value !== "Custom") {
      setForm({ ...form, platform: e.target.value });
    } else {
      setForm({ ...form, platform: "" });
    }
  };
  const handleCustomPlatformChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({ ...form, platform: e.target.value });
  };

  // Edit form handlers
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditPlatformTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setEditPlatformType(e.target.value);
    if (e.target.value !== "Custom") {
      setEditForm({ ...editForm, platform: e.target.value });
    } else {
      setEditForm({ ...editForm, platform: "" });
    }
  };
  const handleEditCustomPlatformChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditForm({ ...editForm, platform: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(form);
    setForm({ name: "", platform: "", code: "" });
    setFormPlatformType(PLATFORM_OPTIONS[0]);
    setShowForm(false);
  };

  const handleEdit = (row: any) => {
    setEditId(row.id);
    setEditForm({ name: row.name, platform: row.platform, code: row.code });
    if (PLATFORM_OPTIONS.includes(row.platform)) {
      setEditPlatformType(row.platform);
    } else {
      setEditPlatformType("Custom");
    }
  };
  const handleEditSave = (id: number) => {
    updateMutation.mutate({ id, ...editForm });
    setEditId(null);
  };
  const handleEditCancel = () => {
    setEditId(null);
  };
  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this affiliate?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <TooltipProvider>
        <div className="max-w-5xl mx-auto py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                Affiliate Marketing
              </h1>
              <p className="text-gray-500 text-sm">
                Manage affiliate codes, platforms, and usage analytics.
              </p>
            </div>
            <Button
              onClick={() => setShowForm((v) => !v)}
              variant="default"
              className="w-full md:w-auto"
            >
              {showForm ? "Close" : "Add Affiliate"}
            </Button>
          </div>

          {showForm && (
            <Card className="mb-8 shadow-lg border border-blue-100 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Add New Affiliate</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col md:flex-row gap-4 items-center"
                >
                  <Input
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="bg-white"
                  />
                  <select
                    name="platformType"
                    value={formPlatformType}
                    onChange={handlePlatformTypeChange}
                    className="bg-white border rounded px-3 py-2 text-gray-700"
                    aria-label="Platform Type"
                  >
                    {PLATFORM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {formPlatformType === "Custom" && (
                    <Input
                      name="platform"
                      placeholder="Custom Platform"
                      value={form.platform}
                      onChange={handleCustomPlatformChange}
                      required
                      className="bg-white"
                    />
                  )}
                  {formPlatformType !== "Custom" && (
                    <input
                      type="hidden"
                      name="platform"
                      value={form.platform}
                    />
                  )}
                  <Input
                    name="code"
                    placeholder="Code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    className="bg-white"
                  />
                  <Button
                    type="submit"
                    disabled={addMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    Add
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-xl border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg">Affiliates List</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table className="min-w-full divide-y divide-gray-200">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-left">Name</TableHead>
                    <TableHead className="py-3 px-4 text-left">
                      Platform
                    </TableHead>
                    <TableHead className="py-3 px-4 text-left">Code</TableHead>
                    <TableHead className="py-3 px-4 text-left">
                      No of Usage
                    </TableHead>
                    <TableHead className="py-3 px-4 text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-400"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-red-500"
                      >
                        Error loading data
                      </TableCell>
                    </TableRow>
                  ) : data && data.length > 0 ? (
                    data.map((row: any, idx: number) => (
                      <TableRow
                        key={row.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {editId === row.id ? (
                          <>
                            <TableCell className="py-2 px-4">
                              <Input
                                name="name"
                                value={editForm.name}
                                onChange={handleEditChange}
                                className="bg-white"
                              />
                            </TableCell>
                            <TableCell className="py-2 px-4">
                              <select
                                name="editPlatformType"
                                value={editPlatformType}
                                onChange={handleEditPlatformTypeChange}
                                className="bg-white border rounded px-3 py-2 text-gray-700"
                                aria-label="Edit Platform Type"
                              >
                                {PLATFORM_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                              {editPlatformType === "Custom" && (
                                <Input
                                  name="platform"
                                  placeholder="Custom Platform"
                                  value={editForm.platform}
                                  onChange={handleEditCustomPlatformChange}
                                  required
                                  className="bg-white mt-2"
                                />
                              )}
                              {editPlatformType !== "Custom" && (
                                <input
                                  type="hidden"
                                  name="platform"
                                  value={editForm.platform}
                                />
                              )}
                            </TableCell>
                            <TableCell className="py-2 px-4">
                              <Input
                                name="code"
                                value={editForm.code}
                                onChange={handleEditChange}
                                className="bg-white"
                              />
                            </TableCell>
                            <TableCell className="py-2 px-4 text-gray-500 font-mono">
                              {row.usageCount}
                            </TableCell>
                            <TableCell className="py-2 px-4 text-center flex gap-2 justify-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="default"
                                    onClick={() => handleEditSave(row.id)}
                                    disabled={updateMutation.isPending}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <Check size={18} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Save</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={handleEditCancel}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                                  >
                                    <X size={18} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancel</TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="py-2 px-4 font-medium text-gray-800">
                              {row.name}
                            </TableCell>
                            <TableCell className="py-2 px-4 text-gray-700">
                              {row.platform}
                            </TableCell>
                            <TableCell className="py-2 px-4 text-blue-700 font-mono">
                              {row.code}
                            </TableCell>
                            <TableCell className="py-2 px-4 text-gray-500 font-mono">
                              {row.usageCount}
                            </TableCell>
                            <TableCell className="py-2 px-4 text-center flex gap-2 justify-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEdit(row)}
                                  >
                                    <Pencil size={18} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={() => handleDelete(row.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 size={18} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-400"
                      >
                        No affiliates found. Click "Add Affiliate" to create
                        one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </AdminLayout>
  );
}
