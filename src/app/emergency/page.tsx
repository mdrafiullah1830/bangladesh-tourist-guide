"use client";

import { useState } from "react";
import { Card, Badge, DataStatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const emergencyNumbers = [
  { name: "National Emergency", number: "999", desc: "Police, Fire, Ambulance", icon: "🆘", type: "critical" },
  { name: "Police", number: "999", desc: "National Police Helpline", icon: "👮", type: "critical" },
  { name: "Fire Service", number: "199", desc: "Fire Emergency", icon: "🔥", type: "critical" },
  { name: "Ambulance", number: "999", desc: "Medical Emergency", icon: "🚑", type: "critical" },
  { name: "Tourist Police", number: "+880 2 8901555", desc: "Dedicated tourist assistance", icon: "🛡️", type: "info" },
  { name: "CID", number: "+880 2 8313678", desc: "Criminal Investigation", icon: "🔍", type: "info" },
  { name: "RAB", number: "+880 2 8961105", desc: "Rapid Action Battalion", icon: "⚡", type: "info" },
  { name: "Child Helpline", number: "1098", desc: "For children in danger", icon: "👶", type: "info" },
];

const hospitals = [
  { name: "Square Hospital", phone: "+880 2 8144400", location: "Dhaka (Panthapath)", type: "Private", hours: "24/7" },
  { name: "Labaid Hospital", phone: "+880 2 8610781", location: "Dhaka (Dhanmondi)", type: "Private", hours: "24/7" },
  { name: "United Hospital", phone: "+880 2 8836000", location: "Dhaka (Gulshan)", type: "Private", hours: "24/7" },
  { name: "Apollo Hospital", phone: "+880 2 8401616", location: "Dhaka (Bashundhara)", type: "Private", hours: "24/7" },
  { name: "Chittagong Medical College", phone: "+880 31 619400", location: "Chattogram", type: "Government", hours: "24/7" },
  { name: "Cox's Bazar Sadar Hospital", phone: "+880 341 63630", location: "Cox's Bazar", type: "Government", hours: "24/7" },
];

const safetyTips = [
  { title: "Personal Safety", tips: [
    "Keep copies of passport and important documents",
    "Use registered ride-sharing apps (Uber, Pathao)",
    "Avoid displaying expensive jewelry or electronics",
    "Stay aware of surroundings in crowded areas",
    "Use hotel safes for valuables",
  ]},
  { title: "Health Safety", tips: [
    "Drink only bottled or purified water",
    "Carry basic medications and first-aid supplies",
    "Use mosquito repellent (dengue prevention)",
    "Eat at busy food stalls with high turnover",
    "Get travel insurance before arrival",
  ]},
  { title: "Solo/Women Travelers", tips: [
    "Dress modestly, especially at religious sites",
    "Use women-only train/bus compartments where available",
    "Share live location with trusted contacts",
    "Avoid isolated areas after dark",
    "Trust your instincts - leave uncomfortable situations",
  ]},
  { title: "Transport Safety", tips: [
    "Use registered taxis or ride-sharing apps",
    "Negotiate fares before boarding CNGs",
    "Keep belongings close on buses/trains",
    "Avoid overnight travel on unfamiliar routes",
    "Note down vehicle number before traveling",
  ]},
];

const embassies = [
  { country: "USA", phone: "+880 2 55662000", address: "Madani Avenue, Baridhara, Dhaka" },
  { country: "UK", phone: "+880 2 8822705", address: "United Nations Road, Dhaka" },
  { country: "Canada", phone: "+880 2 55668444", address: "House 16/A, Road 48, Gulshan, Dhaka" },
  { country: "Australia", phone: "+880 2 8813101", address: "184 Gulshan Avenue, Dhaka" },
  { country: "India", phone: "+880 2 9889339", address: "Plot 1-3, Park Road, Baridhara, Dhaka" },
];

export default function EmergencyPage() {
  const [activeTab, setActiveTab] = useState<"contacts" | "hospitals" | "tips" | "embassies">("contacts");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emergency & Safety</h1>
          <p className="text-gray-500 mt-1">Essential contacts and safety information</p>
        </div>
        <DataStatusBadge status="VERIFIED" />
      </div>

      {/* SOS Banner */}
      <Card className="bg-red-50 border-red-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
              🆘
            </div>
            <div>
              <h3 className="font-bold text-red-900">Emergency? Call 999</h3>
              <p className="text-sm text-red-700">Police, Fire, and Ambulance - Available 24/7</p>
            </div>
          </div>
          <a href="tel:999">
            <Button variant="danger" size="lg">
              📞 Call Now
            </Button>
          </a>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "contacts", label: "📞 Emergency Contacts" },
          { id: "hospitals", label: "🏥 Hospitals" },
          { id: "tips", label: "🛡️ Safety Tips" },
          { id: "embassies", label: "🏛️ Embassies" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-bangladesh-green text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyNumbers.map((contact) => (
            <Card key={contact.name} hover={contact.type === "critical"}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{contact.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                  <p className="text-sm text-gray-500">{contact.desc}</p>
                </div>
                <a href={`tel:${contact.number.replace(/\s/g, "")}`}>
                  <Button variant={contact.type === "critical" ? "danger" : "outline"} size="sm">
                    📞 {contact.number}
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Hospitals Tab */}
      {activeTab === "hospitals" && (
        <div className="space-y-4">
          {hospitals.map((hospital) => (
            <Card key={hospital.name}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🏥</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                    <p className="text-sm text-gray-500">{hospital.location}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={hospital.type === "Private" ? "info" : "default"} size="sm">
                        {hospital.type}
                      </Badge>
                      <Badge variant="success" size="sm">{hospital.hours}</Badge>
                    </div>
                  </div>
                </div>
                <a href={`tel:${hospital.phone.replace(/\s/g, "")}`}>
                  <Button variant="outline" size="sm">
                    📞 {hospital.phone}
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Safety Tips Tab */}
      {activeTab === "tips" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safetyTips.map((section) => (
            <Card key={section.title}>
              <h3 className="font-bold text-gray-900 mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-bangladesh-green mt-0.5">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {/* Embassies Tab */}
      {activeTab === "embassies" && (
        <div className="space-y-4">
          {embassies.map((embassy) => (
            <Card key={embassy.country}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">🏛️ {embassy.country} Embassy</h3>
                  <p className="text-sm text-gray-500 mt-1">{embassy.address}</p>
                </div>
                <a href={`tel:${embassy.phone.replace(/\s/g, "")}`}>
                  <Button variant="outline" size="sm">
                    📞 {embassy.phone}
                  </Button>
                </a>
              </div>
            </Card>
          ))}
          <Card className="bg-yellow-50 border-yellow-200">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> If your country isn&apos;t listed, contact the national emergency 
              number (999) for assistance, or check with your country&apos;s foreign affairs website 
              for honorary consular services.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
