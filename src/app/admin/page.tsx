"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Input";
import { bangladeshDestinations } from "@/lib/data/bangladesh";

type AdminSection = "overview" | "destinations" | "transport" | "hotels" | "alerts" | "users";

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>("overview");
  const [isEditing, setIsEditing] = useState(false);

  const stats = [
    { label: "Total Destinations", value: bangladeshDestinations.length, icon: "🏖️" },
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
                <Input label="Name" placeholder="Destination name" />
                <Select
                  label="Division"
                  options={[
                    { value: "", label: "Select division" },
                    { value: "dhaka", label: "Dhaka" },
                    { value: "chattogram", label: "Chattogram" },
                    { value: "sylhet", label: "Sylhet" },
                    { value: "khulna", label: "Khulna" },
                    { value: "rajshahi", label: "Rajshahi" },
                  ]}
                />
                <Input label="Latitude" type="number" placeholder="23.8103" />
                <Input label="Longitude" type="number" placeholder="90.4125" />
                <Textarea label="Description" placeholder="Describe the destination..." className="md:col-span-2" />
                <Input label="Estimated Cost/Day (BDT)" type="number" placeholder="2000" />
                <Input label="Best Time to Visit" placeholder="October to March" />
              </div>
              <div className="flex gap-3 mt-4">
                <Button>Save Destination</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {bangladeshDestinations.map((dest) => (
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
                    <Button variant="ghost" size="sm">Edit</Button>
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
              {[
                { name: "John Smith", email: "john@example.com", role: "traveller", joined: "2026-08-15" },
                { name: "Sarah Johnson", email: "sarah@example.com", role: "traveller", joined: "2026-08-20" },
                { name: "Admin User", email: "admin@bdguide.com", role: "admin", joined: "2026-01-01" },
              ].map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
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
    </div>
  );
}
