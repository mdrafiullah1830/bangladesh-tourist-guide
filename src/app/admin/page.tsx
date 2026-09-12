"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge, Skeleton } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { bangladeshDestinations as staticDestinations } from "@/lib/data/bangladesh";

type AdminSection = "overview" | "destinations" | "transport" | "hotels" | "alerts" | "users";

interface DestinationForm {
  name: string;
  division: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string;
  estimatedCost: number;
  bestTimeToVisit: string;
}

interface AdminDestination {
  slug: string;
  name: string;
  division: string;
  category: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  estimatedCost?: number;
  bestTimeToVisit?: string;
  stayDuration?: string;
  safetyRating?: number;
  isHiddenGem?: boolean;
  tags?: string[];
}

interface AdminUser {
  name: string;
  email: string;
  role: string;
  joined: string;
}

export default function AdminPage() {
  const { showToast } = useToast();
  const [section, setSection] = useState<AdminSection>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [users] = useState<AdminUser[]>([
    { name: "John Smith", email: "john@example.com", role: "traveller", joined: "2026-08-15" },
    { name: "Sarah Johnson", email: "sarah@example.com", role: "traveller", joined: "2026-08-20" },
    { name: "Admin User", email: "admin@bdguide.com", role: "admin", joined: "2026-01-01" },
  ]);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [destinationForm, setDestinationForm] = useState<DestinationForm>({
    name: "",
    division: "",
    category: "city",
    latitude: 0,
    longitude: 0,
    description: "",
    estimatedCost: 2000,
    bestTimeToVisit: "",
  });

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch destinations
      const destResponse = await fetch("/api/destinations");
      if (destResponse.ok) {
        const destData = await destResponse.json();
        setDestinations(destData.destinations?.length ? destData.destinations : staticDestinations);
      } else {
        setDestinations(staticDestinations);
      }
    } catch {
      setDestinations(staticDestinations);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveDestination = async () => {
    if (!destinationForm.name) {
      setFeedback("Destination name is required");
      return;
    }
    setIsSaving(true);
    setFeedback("");
    try {
      const response = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destinationForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save destination');
      setDestinations(prev => [...prev, result.destination]);
      setIsEditing(false);
      showToast(`"${destinationForm.name}" added successfully!`, "success");
      setDestinationForm({
        name: "", division: "", category: "city",
        latitude: 0, longitude: 0, description: "",
        estimatedCost: 2000, bestTimeToVisit: "",
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save destination', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDestination = (slug: string) => {
    setDeleteTarget(slug);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const slug = deleteTarget;
    try {
      const response = await fetch(`/api/destinations?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete destination');
      setDestinations(prev => prev.filter(d => d.slug !== slug));
      showToast(`"${slug}" deleted`, "success");
      setDeleteTarget(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to delete destination', 'error');
    }
  };

  const stats = [
    { label: "Total Destinations", value: destinations.length, icon: "🏖️" },
    { label: "Transport Routes", value: 12, icon: "🚌" },
    { label: "Hotels Listed", value: 45, icon: "🏨" },
    { label: "Active Alerts", value: 2, icon: "⚠️" },
    { label: "Registered Users", value: 156, icon: "👥" },
    { label: "Reviews", value: 89, icon: "⭐" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage destinations, transport, and content</p>
        </div>
        <Badge variant="success">Admin Access</Badge>
      </div>

      {!isLoading && (
      <>
      {/* Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "destinations", label: "🏖️ Destinations" },
          { id: "transport", label: "🚌 Transport" },
          { id: "hotels", label: "🏨 Hotels" },
          { id: "alerts", label: "⚠️ Alerts" },
          { id: "users", label: "👥 Users" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id as AdminSection)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              section === tab.id
                ? "bg-bangladesh-green text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          {feedback}
        </div>
      )}

      {/* Overview */}
      {section === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { action: "New destination added", item: "Kuakata", time: "2 hours ago" },
                  { action: "Transport route updated", item: "Dhaka-Chattogram", time: "5 hours ago" },
                  { action: "Alert published", item: "Monsoon warning", time: "1 day ago" },
                  { action: "Hotel verified", item: "Hotel Paradise", time: "2 days ago" },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <div className="text-sm font-medium">{activity.action}</div>
                      <div className="text-xs text-gray-500">{activity.item}</div>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setSection("destinations")}>
                  + Add Destination
                </Button>
                <Button variant="outline" onClick={() => setSection("transport")}>
                  + Add Route
                </Button>
                <Button variant="outline" onClick={() => setSection("hotels")}>
                  + Add Hotel
                </Button>
                <Button variant="outline" onClick={() => setSection("alerts")}>
                  + Add Alert
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Destinations Management */}
      {section === "destinations" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Manage Destinations</h2>
            <Button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "+ Add New"}
            </Button>
          </div>

          {isEditing && (
            <Card className="border-bangladesh-green/30">
              <h3 className="font-semibold mb-4">Add New Destination</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  placeholder="Destination name"
                  value={destinationForm.name}
                  onChange={(e) => setDestinationForm({ ...destinationForm, name: e.target.value })}
                  required
                />
                <Select
                  label="Division"
                  value={destinationForm.division}
                  onChange={(e) => setDestinationForm({ ...destinationForm, division: e.target.value })}
                  options={[
                    { value: "", label: "Select division" },
                    { value: "Dhaka", label: "Dhaka" },
                    { value: "Chattogram", label: "Chattogram" },
                    { value: "Sylhet", label: "Sylhet" },
                    { value: "Khulna", label: "Khulna" },
                    { value: "Rajshahi", label: "Rajshahi" },
                    { value: "Barishal", label: "Barishal" },
                    { value: "Rangpur", label: "Rangpur" },
                    { value: "Mymensingh", label: "Mymensingh" },
                  ]}
                />
                <Select
                  label="Category"
                  value={destinationForm.category}
                  onChange={(e) => setDestinationForm({ ...destinationForm, category: e.target.value })}
                  options={[
                    { value: "city", label: "City" },
                    { value: "beach", label: "Beach" },
                    { value: "nature", label: "Nature" },
                    { value: "heritage", label: "Heritage" },
                    { value: "mountain", label: "Mountain" },
                  ]}
                />
                <Input
                  label="Latitude"
                  type="number"
                  placeholder="23.8103"
                  value={destinationForm.latitude || ""}
                  onChange={(e) => setDestinationForm({ ...destinationForm, latitude: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Longitude"
                  type="number"
                  placeholder="90.4125"
                  value={destinationForm.longitude || ""}
                  onChange={(e) => setDestinationForm({ ...destinationForm, longitude: parseFloat(e.target.value) || 0 })}
                />
                <Textarea
                  label="Description"
                  placeholder="Describe the destination..."
                  className="md:col-span-2"
                  value={destinationForm.description}
                  onChange={(e) => setDestinationForm({ ...destinationForm, description: e.target.value })}
                />
                <Input
                  label="Estimated Cost/Day (BDT)"
                  type="number"
                  placeholder="2000"
                  value={destinationForm.estimatedCost || ""}
                  onChange={(e) => setDestinationForm({ ...destinationForm, estimatedCost: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Best Time to Visit"
                  placeholder="October to March"
                  value={destinationForm.bestTimeToVisit}
                  onChange={(e) => setDestinationForm({ ...destinationForm, bestTimeToVisit: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleSaveDestination} disabled={isSaving} isLoading={isSaving}>
                  Save Destination
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {destinations.map((dest) => (
              <Card key={dest.slug}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {dest.category === "beach" ? "🏖️" : dest.category === "nature" ? "🌿" : dest.category === "heritage" ? "🏛️" : "🏙️"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{dest.name}</h4>
                      <p className="text-sm text-gray-500">{dest.division} • {dest.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dest.isHiddenGem && <Badge variant="warning">💎 Gem</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteDestination(dest.slug)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transport Management */}
      {section === "transport" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Manage Transport Routes</h2>
            <Button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "+ Add Route"}
            </Button>
          </div>

          {isEditing && (
            <Card className="border-bangladesh-green/30">
              <h3 className="font-semibold mb-4">Add New Route</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Select
                  label="From"
                  options={[
                    { value: "", label: "Select origin" },
                    { value: "dhaka", label: "Dhaka" },
                    { value: "chattogram", label: "Chattogram" },
                    { value: "sylhet", label: "Sylhet" },
                  ]}
                />
                <Select
                  label="To"
                  options={[
                    { value: "", label: "Select destination" },
                    { value: "dhaka", label: "Dhaka" },
                    { value: "chattogram", label: "Chattogram" },
                    { value: "sylhet", label: "Sylhet" },
                  ]}
                />
                <Select
                  label="Mode"
                  options={[
                    { value: "", label: "Select mode" },
                    { value: "bus", label: "Bus" },
                    { value: "train", label: "Train" },
                    { value: "flight", label: "Flight" },
                    { value: "launch", label: "Launch" },
                  ]}
                />
                <Input label="Operator" placeholder="Transport company" />
                <Input label="Fare Min (BDT)" type="number" placeholder="500" />
                <Input label="Fare Max (BDT)" type="number" placeholder="1500" />
                <Input label="Duration" placeholder="5-6 hours" />
                <Input label="Distance (km)" type="number" placeholder="250" />
                <Input label="Schedule" placeholder="Every 2 hours" />
              </div>
              <div className="flex gap-3 mt-4">
                <Button>Save Route</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          <Card>
            <p className="text-gray-500 text-sm">12 routes configured. Click &quot;Add Route&quot; to add new transport options.</p>
          </Card>
        </div>
      )}

      {/* Hotels Management */}
      {section === "hotels" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Manage Hotels</h2>
            <Button>+ Add Hotel</Button>
          </div>
          <Card>
            <p className="text-gray-500 text-sm">45 hotels listed across all destinations.</p>
          </Card>
        </div>
      )}

      {/* Alerts Management */}
      {section === "alerts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Travel Alerts</h2>
            <Button>+ Add Alert</Button>
          </div>
          <div className="space-y-3">
            <Card className="border-yellow-200 bg-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="warning">Active</Badge>
                  <h4 className="font-semibold mt-1">Monsoon Season Advisory</h4>
                  <p className="text-sm text-gray-600">Heavy rainfall expected in coastal areas. Exercise caution.</p>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="info">Info</Badge>
                  <h4 className="font-semibold mt-1">Eid Holiday Travel Rush</h4>
                  <p className="text-sm text-gray-600">Book transport 2 weeks in advance during Eid.</p>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Users Management */}
      {section === "users" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <Card>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.email} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === "admin" ? "error" : "default"}>{user.role}</Badge>
                    <span className="text-xs text-gray-400">{user.joined}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      </>
      )}

      {isLoading && (
        <Card>
          <Skeleton lines={8} />
        </Card>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete destination"
        message={`Are you sure you want to delete "${deleteTarget}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
