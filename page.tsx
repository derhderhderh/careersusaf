"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react"

interface User {
  user_id: number
  username: string
  has_required_role: boolean
}

interface ApplicationData {
  position: string
  discord_username: string
  discord_id: string
  roblox_username: string
  has_atc24_role: boolean
  [key: string]: any
}

const POSITION_CONFIGS = {
  airmen: {
    title: "✈️ Airmen Enlistee Application",
    description: "Entry-level position for new recruits",
    questions: [
      {
        id: "why_join",
        label: "Why do you want to join as an Airmen Enlistee?",
        type: "textarea",
        required: true,
      },
      {
        id: "availability",
        label: "What is your availability? (Days/Times)",
        type: "textarea",
        required: true,
      },
    ],
  },
  nco: {
    title: "⭐ Non-Commissioned Officer Application",
    description: "Leadership position application",
    questions: [
      {
        id: "leadership_experience",
        label: "Describe your leadership experience:",
        type: "textarea",
        required: true,
      },
      {
        id: "why_position",
        label: "Why do you want this position?",
        type: "textarea",
        required: true,
      },
      {
        id: "availability",
        label: "What is your availability? (Days/Times)",
        type: "textarea",
        required: true,
      },
    ],
  },
  co: {
    title: "🎖️ Commissioned Officer Application",
    description: "Senior leadership position application",
    questions: [
      {
        id: "experience",
        label: "Describe your relevant experience:",
        type: "textarea",
        required: true,
      },
      {
        id: "leadership_experience",
        label: "Describe your leadership and command experience:",
        type: "textarea",
        required: true,
      },
      {
        id: "why_position",
        label: "Why do you want to be a Commissioned Officer?",
        type: "textarea",
        required: true,
      },
      {
        id: "availability",
        label: "What is your availability? (Days/Times)",
        type: "textarea",
        required: true,
      },
    ],
  },
  fo: {
    title: "🌟 Field Officer Application",
    description: "Specialized field operations position",
    questions: [
      {
        id: "field_experience",
        label: "Describe your field operations experience:",
        type: "textarea",
        required: true,
      },
      {
        id: "tactical_knowledge",
        label: "Describe your tactical knowledge and training:",
        type: "textarea",
        required: true,
      },
      {
        id: "why_position",
        label: "Why do you want to be a Field Officer?",
        type: "textarea",
        required: true,
      },
      {
        id: "availability",
        label: "What is your availability? (Days/Times)",
        type: "textarea",
        required: true,
      },
    ],
  },
}

export default function CareersPage() {
  const [currentStep, setCurrentStep] = useState<"discord-input" | "loading" | "job-list" | "application" | "success">(
    "discord-input",
  )
  const [discordId, setDiscordId] = useState("")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentPosition, setCurrentPosition] = useState<keyof typeof POSITION_CONFIGS | null>(null)
  const [botOnline, setBotOnline] = useState(true)
  const [showSystemDown, setShowSystemDown] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<ApplicationData>({
    position: "",
    discord_username: "",
    discord_id: "",
    roblox_username: "",
    has_atc24_role: false,
  })

  // Replace localhost URLs with your bot's hosted URL
  const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || "https://your-bot-api-url.com"

  useEffect(() => {
    checkBotStatus()
    const interval = setInterval(checkBotStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkBotStatus = async () => {
    try {
      const response = await fetch(`${BOT_API_URL}/api/bot-status`)
      const data = await response.json()
      const isOnline = data.online

      if (botOnline && !isOnline && (currentStep === "job-list" || currentStep === "application")) {
        setShowSystemDown(true)
      } else if (!botOnline && isOnline) {
        setShowSystemDown(false)
      }

      setBotOnline(isOnline)
    } catch (error) {
      setBotOnline(false)
      if (currentStep === "job-list" || currentStep === "application") {
        setShowSystemDown(true)
      }
    }
  }

  const handleDiscordIdSubmit = async () => {
    if (!botOnline) {
      setError("System is currently down. Please try again later.")
      return
    }

    if (!discordId.trim()) {
      setError("Please enter your Discord ID.")
      return
    }

    if (!/^\d{17,20}$/.test(discordId.trim())) {
      setError("Please enter a valid Discord ID (17-20 digits).")
      return
    }

    setCurrentStep("loading")
    setError("")

    try {
      const response = await fetch(`${BOT_API_URL}/api/check-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: discordId.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentUser(data)
        setCurrentStep("job-list")
      } else {
        setCurrentStep("discord-input")
        setError(data.error || "User not found. Please make sure you are in the server.")
      }
    } catch (error) {
      setCurrentStep("discord-input")
      setError("Connection error. Please try again.")
    }
  }

  const startApplication = (position: keyof typeof POSITION_CONFIGS) => {
    if (!botOnline) {
      alert("System is currently down. Please wait for it to come back online.")
      return
    }

    setCurrentPosition(position)
    setCurrentStep("application")
    setFormData({
      position: POSITION_CONFIGS[position].title,
      discord_username: "",
      discord_id: currentUser?.user_id.toString() || "",
      roblox_username: "",
      has_atc24_role: false,
    })
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!botOnline) {
      setError("System is currently down. Please wait for it to come back online.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(`${BOT_API_URL}/api/submit-application`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setCurrentStep("success")
      } else {
        setError(result.error || "Failed to submit application.")
      }
    } catch (error) {
      setError("Connection error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!botOnline && currentStep === "discord-input") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">🚫 System Down</h2>
            <p className="text-red-600 mb-4">The career application system is currently unavailable.</p>
            <p className="text-red-600 mb-6">Please try again later.</p>
            <Button onClick={checkBotStatus} variant="outline">
              Check Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* System Down Overlay */}
      {showSystemDown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-700 mb-2">⚠️ System Temporarily Down</h2>
              <p className="text-yellow-600 mb-4">
                Our system is temporarily offline. Please do not close this tab or you will lose your work. We'll
                automatically resume when the system is back online.
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Waiting for system to come back online...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Discord ID Input */}
        {currentStep === "discord-input" && (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">🎯 USAF24 Careers</CardTitle>
              <CardDescription>Enter your Discord ID to access career opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discordId">Discord ID</Label>
                <Input
                  id="discordId"
                  placeholder="e.g., 123456789012345678"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleDiscordIdSubmit()}
                />
                <p className="text-sm text-gray-600">
                  Don't know your Discord ID?{" "}
                  <a
                    href="https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Learn how to find it
                  </a>
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleDiscordIdSubmit} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {currentStep === "loading" && (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Verifying your Discord account...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job List */}
        {currentStep === "job-list" && currentUser && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🚀 USAF24 Careers</h1>
              <p className="text-lg text-gray-600">Welcome, {currentUser.username}! Choose a position to apply for.</p>
            </div>

            <Alert className="mb-8">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your Discord ID has been verified. You have access to the positions shown below based on your current
                roles.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Airmen Enlistee - Available for users WITHOUT required role */}
              {!currentUser.has_required_role && (
                <JobCard
                  title="✈️ Airmen Enlistee"
                  description="Entry-level position for new recruits. Perfect for those starting their career in aviation."
                  requirements={["No special role required", "Basic Discord knowledge", "Commitment to learning"]}
                  onClick={() => startApplication("airmen")}
                />
              )}

              {/* Advanced positions - Available for users WITH required role */}
              {currentUser.has_required_role && (
                <>
                  <JobCard
                    title="⭐ Non-Commissioned Officer"
                    description="Leadership position for experienced personnel. Responsible for training and supervising airmen."
                    requirements={["Required role verification", "Leadership experience", "Active community member"]}
                    onClick={() => startApplication("nco")}
                  />

                  <JobCard
                    title="🎖️ Commissioned Officer"
                    description="Senior leadership position with strategic responsibilities and command authority."
                    requirements={["Required role verification", "Extensive experience", "Strategic thinking skills"]}
                    onClick={() => startApplication("co")}
                  />

                  <JobCard
                    title="🌟 Field Officer"
                    description="Specialized field operations role with tactical command responsibilities."
                    requirements={["Required role verification", "Field operations experience", "Tactical knowledge"]}
                    onClick={() => startApplication("fo")}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Application Form */}
        {currentStep === "application" && currentPosition && (
          <div>
            <div className="mb-6">
              <Button variant="ghost" onClick={() => setCurrentStep("job-list")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Positions
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle>{POSITION_CONFIGS[currentPosition].title}</CardTitle>
                  <CardDescription>{POSITION_CONFIGS[currentPosition].description}</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <form onSubmit={handleApplicationSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discordUsername">Discord Username *</Label>
                      <Input
                        id="discordUsername"
                        placeholder="e.g., username#1234"
                        value={formData.discord_username}
                        onChange={(e) => updateFormData("discord_username", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discordIdConfirm">Discord ID *</Label>
                      <Input
                        id="discordIdConfirm"
                        placeholder="Confirm your Discord ID"
                        value={formData.discord_id}
                        onChange={(e) => updateFormData("discord_id", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="robloxUsername">Roblox Username *</Label>
                    <Input
                      id="robloxUsername"
                      placeholder="Your Roblox username"
                      value={formData.roblox_username}
                      onChange={(e) => updateFormData("roblox_username", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Do you have the ATC24 role in ATC24? *</Label>
                    <Select
                      value={formData.has_atc24_role ? "yes" : "no"}
                      onValueChange={(value) => updateFormData("has_atc24_role", value === "yes")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Questions</CardTitle>
                  <CardDescription>Please answer all questions thoroughly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {POSITION_CONFIGS[currentPosition].questions.map((question, index) => (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={question.id}>
                        {index + 1}. {question.label} *
                      </Label>
                      <Textarea
                        id={question.id}
                        placeholder="Your answer..."
                        value={formData[question.id] || ""}
                        onChange={(e) => updateFormData(question.id, e.target.value)}
                        className="min-h-[100px]"
                        required={question.required}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep("job-list")} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting || !botOnline}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Success */}
        {currentStep === "success" && (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="text-green-600 mb-4">
                <CheckCircle className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Application Submitted!</h2>
              <p className="text-green-600 mb-6">
                Your application has been successfully submitted. You will receive a DM on Discord with updates about
                your application status.
              </p>
              <Button onClick={() => setCurrentStep("job-list")} className="w-full">
                Return to Jobs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function JobCard({
  title,
  description,
  requirements,
  onClick,
}: {
  title: string
  description: string
  requirements: string[]
  onClick: () => void
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Requirements:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
          <Button className="w-full">Apply Now</Button>
        </div>
      </CardContent>
    </Card>
  )
}
