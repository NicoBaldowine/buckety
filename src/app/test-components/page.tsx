"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { BucketCard } from "@/components/ui/bucket-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Download, Settings, Heart, Star, User } from "lucide-react"

export default function TestComponentsPage() {
  return (
    <div className="min-h-screen p-8 bg-background transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Component Test</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/70">Toggle theme:</span>
            <ThemeToggle />
          </div>
        </div>
        
        <div className="space-y-12">
          {/* Bucket Card */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Bucket Card</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BucketCard
                title="Vacation Fund"
                currentAmount={450}
                targetAmount={1200}
                apy={3.5}
                backgroundColor="#B6F3AD"
              />
              <BucketCard
                title="Emergency Fund"
                currentAmount={750}
                targetAmount={1000}
                apy={3.2}
                backgroundColor="#FFB6AD"
              />
              <BucketCard
                title="New Car"
                currentAmount={2300}
                targetAmount={5000}
                apy={4.1}
                backgroundColor="#ADB6FF"
              />
            </div>
          </section>

          {/* Badge Component */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Badge Component</h2>
            <div className="flex flex-wrap gap-4">
              <Badge>APY 3.5%</Badge>
              <Badge>APY 4.2%</Badge>
              <Badge>APY 2.8%</Badge>
            </div>
          </section>

          {/* Progress Component */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Progress Component</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress: 25%</span>
                </div>
                <Progress value={25} max={100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress: 50%</span>
                </div>
                <Progress value={50} max={100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress: 75%</span>
                </div>
                <Progress value={75} max={100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress: 100%</span>
                </div>
                <Progress value={100} max={100} />
              </div>
            </div>
          </section>

          {/* Primary Buttons */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Primary Buttons</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Default State</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Default Primary</Button>
                  <Button variant="primary" size="sm">Small Primary</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">With Icons - Left</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" icon={<Plus />} iconPosition="left">Add Item</Button>
                  <Button variant="primary" icon={<Download />} iconPosition="left" size="sm">Download</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">With Icons - Right</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" icon={<Plus />} iconPosition="right">Add Item</Button>
                  <Button variant="primary" icon={<Download />} iconPosition="right" size="sm">Download</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Disabled State</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" disabled>Disabled Primary</Button>
                  <Button variant="primary" icon={<Plus />} iconPosition="left" disabled>Disabled with Icon</Button>
                  <Button variant="primary" size="sm" disabled>Small Disabled</Button>
                </div>
              </div>
            </div>
          </section>

          {/* Secondary Buttons */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Secondary Buttons</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Default State</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary">Default Secondary</Button>
                  <Button variant="secondary" size="sm">Small Secondary</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">With Icons - Left</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary" icon={<Heart />} iconPosition="left">Favorite</Button>
                  <Button variant="secondary" icon={<Star />} iconPosition="left" size="sm">Rate</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">With Icons - Right</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary" icon={<Heart />} iconPosition="right">Favorite</Button>
                  <Button variant="secondary" icon={<Star />} iconPosition="right" size="sm">Rate</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Disabled State</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary" disabled>Disabled Secondary</Button>
                  <Button variant="secondary" icon={<Heart />} iconPosition="left" disabled>Disabled with Icon</Button>
                  <Button variant="secondary" size="sm" disabled>Small Disabled</Button>
                </div>
              </div>
            </div>
          </section>

          {/* Icon Only Buttons */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Icon Only Buttons (Secondary)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Default State</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary-icon" icon={<Plus />} />
                  <Button variant="secondary-icon" icon={<Download />} />
                  <Button variant="secondary-icon" icon={<Settings />} />
                  <Button variant="secondary-icon" icon={<Heart />} />
                  <Button variant="secondary-icon" icon={<Star />} />
                  <Button variant="secondary-icon" icon={<User />} />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Disabled State</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary-icon" icon={<Plus />} disabled />
                  <Button variant="secondary-icon" icon={<Download />} disabled />
                  <Button variant="secondary-icon" icon={<Settings />} disabled />
                  <Button variant="secondary-icon" icon={<Heart />} disabled />
                  <Button variant="secondary-icon" icon={<Star />} disabled />
                  <Button variant="secondary-icon" icon={<User />} disabled />
                </div>
              </div>
            </div>
          </section>

          {/* Avatar Buttons */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Avatar Buttons</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Default State</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="avatar" initial="N" />
                  <Button variant="avatar" initial="A" />
                  <Button variant="avatar" initial="M" />
                  <Button variant="avatar" initial="J" />
                  <Button variant="avatar" initial="S" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Disabled State</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="avatar" initial="N" disabled />
                  <Button variant="avatar" initial="A" disabled />
                  <Button variant="avatar" initial="M" disabled />
                </div>
              </div>
            </div>
          </section>

          {/* Color Theme Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Theme Colors Demo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 rounded-lg border border-secondary">
                <h3 className="font-medium mb-4 text-foreground">Primary Colors</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary border"></div>
                    <span className="text-sm text-foreground/70">Primary Background</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary-foreground border"></div>
                    <span className="text-sm text-foreground/70">Primary Text</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-lg border border-secondary">
                <h3 className="font-medium mb-4 text-foreground">Secondary Colors</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-secondary border"></div>
                    <span className="text-sm text-foreground/70">Secondary Background</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-secondary-foreground border"></div>
                    <span className="text-sm text-foreground/70">Secondary Text</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Examples */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Interactive Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border border-secondary rounded-lg">
                <h3 className="font-medium mb-3">Action Buttons</h3>
                <div className="space-y-2">
                  <Button variant="primary" icon={<Plus />} iconPosition="left" className="w-full">Create New</Button>
                  <Button variant="secondary" icon={<Download />} iconPosition="right" className="w-full">Export Data</Button>
                </div>
              </div>
              
              <div className="p-4 border border-secondary rounded-lg">
                <h3 className="font-medium mb-3">Social Actions</h3>
                <div className="flex gap-2">
                  <Button variant="secondary-icon" icon={<Heart />} />
                  <Button variant="secondary-icon" icon={<Star />} />
                  <Button variant="secondary" icon={<User />} iconPosition="left">Follow</Button>
                </div>
              </div>
              
              <div className="p-4 border border-secondary rounded-lg">
                <h3 className="font-medium mb-3">Settings Panel</h3>
                <div className="space-y-2">
                  <Button variant="secondary" icon={<Settings />} iconPosition="left" className="w-full justify-start">Preferences</Button>
                  <Button variant="secondary" className="w-full justify-start" disabled>Account (Coming Soon)</Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}