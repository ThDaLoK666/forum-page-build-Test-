"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

interface AskQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const subjects = [
  { code: "ITCS210", name: "Fundamental Programming Concepts" },
  { code: "ITCS212", name: "Data Structures" },
  { code: "ITCS332", name: "Information System Analysis and Design" },
  { code: "ICCS340", name: "Database Systems" },
  { code: "ITCS371", name: "Introduction to Software Engineering" },
];

export function AskQuestionModal({
  open,
  onOpenChange,
}: AskQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [codeBlockWithImage, setCodeBlockWithImage] = useState(false);
  const [imageUploadCount, setImageUploadCount] = useState(0);

  const handleSubmit = () => {
    // Handle form submission
    console.log({ title, content, subject, isAnonymous });
    onOpenChange(false);
    // Reset form
    setTitle("");
    setContent("");
    setSubject("");
    setIsAnonymous(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Ask a Question</DialogTitle>
        </DialogHeader>

        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              placeholder="What&apos;s your question?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="content">Content</FieldLabel>
            <Textarea
              id="content"
              placeholder="Provide more details about your question..."
              className="min-h-32"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="subject" className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label htmlFor="anonymous" className="text-sm font-medium">
                Ask Anonymously
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your name won&apos;t be shown to others
              </p>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>
        </FieldGroup>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title || !subject}>
            Post Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
