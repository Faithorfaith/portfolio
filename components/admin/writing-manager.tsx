'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface WritingManagerProps {
  userId: string
}

export default function WritingManager({ userId }: WritingManagerProps) {
  const [substackUrl, setSubstackUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleImportFromSubstack = async () => {
    if (!substackUrl.trim()) {
      setError('Please enter your Substack URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/writing/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          substackUrl: substackUrl.trim(),
          userId 
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to import writings')
      }

      setSuccess(true)
      setSubstackUrl('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import writings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import from Substack</CardTitle>
          <CardDescription>
            Connect your Substack publication to automatically import your writings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Substack Publication URL
            </label>
            <Input
              type="url"
              placeholder="https://yourname.substack.com"
              value={substackUrl}
              onChange={(e) => setSubstackUrl(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-foreground/50 mt-2">
              Enter your Substack publication URL to import all published posts
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600">Writings imported successfully!</p>
            </div>
          )}

          <Button
            onClick={handleImportFromSubstack}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Importing...' : 'Import from Substack'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/70 space-y-2">
          <p>✓ Connect your Substack publication URL</p>
          <p>✓ We&apos;ll fetch your published posts</p>
          <p>✓ Your writings will appear in the Writing section</p>
          <p>✓ Updates automatically when you publish on Substack</p>
        </CardContent>
      </Card>
    </div>
  )
}
