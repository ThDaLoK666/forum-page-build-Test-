"use client";

import { useState, useEffect } from "react";
import { BookOpen, Bell, Clock4, X, ChevronRight, Calendar, Users, Globe, ExternalLink, Plus, ArrowRight, Video, Timer, BookMarked, BookOpenCheck, BellRing } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StudySession {
  id: string;
  title: string;
  description: string;
  subject: string;
  tags: string[];
  date: Date;
  duration: string;
  location: string;
  meetingLink: string;
  maxParticipants: number;
  currentParticipants: number;
  organizer: {
    name: string;
    initials: string;
    year: string;
  };
  meetingType: "in-person" | "online" | "hybrid";
  isPinned: boolean;
  createdAt: Date;
}

// Utility functions (outside of component)
const getTimeUntil = (date: Date) => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
  } else {
    return 'Starting soon';
  }
};

const getTimeColor = (date: Date) => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours <= 24) return "text-red-600 font-bold animate-pulse";
  if (hours <= 72) return "text-orange-600";
  return "text-green-600";
};

const getMeetingIcon = (type: string) => {
  switch (type) {
    case "online": return <Video className="w-4 h-4" />;
    case "in-person": return <Users className="w-4 h-4" />;
    case "hybrid": return <Globe className="w-4 h-4" />;
    default: return <Calendar className="w-4 h-4" />;
  }
};

const getMeetingLabel = (type: string) => {
  switch (type) {
    case "online": return "Online";
    case "in-person": return "In-person";
    case "hybrid": return "Hybrid";
    default: return "Scheduled";
  }
};

const mockStudySessions: StudySession[] = [
  {
    id: "1",
    title: "ITCS212 - BST Exam Review Session",
    description: "Comprehensive review of Binary Search Tree implementation, time complexity analysis, and practice problems for upcoming exam",
    subject: "ITCS212",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "Data Structures"],
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    duration: "3 hours",
    location: "Room 101, Computer Lab 2",
    meetingLink: "https://meet.ict-mahidol.ac.th/bst-review",
    maxParticipants: 15,
    currentParticipants: 8,
    organizer: {
      name: "Dr. Somchai P.",
      initials: "SP",
      year: "Instructor"
    },
    meetingType: "in-person",
    isPinned: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Database Systems - JOIN Types Deep Dive",
    description: "Interactive session focusing on different SQL JOIN types, visual explanations, and real-world use cases",
    subject: "ICCS340",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "SQL", "Database"],
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    duration: "2 hours",
    location: "Zoom Meeting",
    meetingLink: "https://zoom.us/j/1234567890",
    maxParticipants: 20,
    currentParticipants: 12,
    organizer: {
      name: "Siriporn K.",
      initials: "SK",
      year: "Year 2"
    },
    meetingType: "online",
    isPinned: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "Agile Methodology - Project Management",
    description: "Group discussion on Agile vs Waterfall, sprint planning, and practical implementation in software engineering",
    subject: "ITCS371",
    tags: ["#StudyGroup", "#Assignment1", "Agile", "Project Management"],
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    duration: "1.5 hours",
    location: "Hall A, Building 3",
    meetingLink: "",
    maxParticipants: 10,
    currentParticipants: 4,
    organizer: {
      name: "Thanawat P.",
      initials: "TP",
      year: "Year 3"
    },
    meetingType: "in-person",
    isPinned: true,
    createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    title: "Java Exception Handling Workshop",
    description: "Hands-on workshop covering try-catch, custom exceptions, and best practices for error handling",
    subject: "ITCS210",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "Java", "OOP"],
    date: new Date(Date.now() + 4 * 60 * 60 * 1000),
    duration: "2.5 hours",
    location: "Online Session",
    meetingLink: "https://zoom.us/j/9876543210",
    maxParticipants: 25,
    currentParticipants: 18,
    organizer: {
      name: "Nattapong S.",
      initials: "NS",
      year: "Year 1"
    },
    meetingType: "online",
    isPinned: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    title: "UML Diagram Masterclass",
    description: "Learn how to create effective UML diagrams for system analysis and design, step by step",
    subject: "ITCS332",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "UML", "System Design"],
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    duration: "3 hours",
    location: "Classroom 2B",
    meetingLink: "",
    maxParticipants: 12,
    currentParticipants: 9,
    organizer: {
      name: "Pornpimol C.",
      initials: "PC",
      year: "Year 3"
    },
    meetingType: "in-person",
    isPinned: true,
    createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
  },
];

export function StudySessionFilter() {
  const [sessions, setSessions] = useState<StudySession[]>(mockStudySessions);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showCalender, setShowCalender] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState("student");
  const [joinedSessions, setJoinedSessions] = useState<Set<string>>(new Set());
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const allTags = Array.from(new Set(mockStudySessions.flatMap(session => session.tags)));

  const filteredSessions = sessions.filter(session => {
    if (filterTag && !session.tags.includes(filterTag)) return false;
    if (selectedDate) {
      const sessionDate = new Date(session.date);
      const selected = new Date(selectedDate);
      if (sessionDate.getDate() !== selected.getDate() || 
          sessionDate.getMonth() !== selected.getMonth() || 
          sessionDate.getFullYear() !== selected.getFullYear()) {
        return false;
      }
    }
    return true;
  });

  const displaySessions = showAllSessions ? filteredSessions : filteredSessions.slice(0, 3);

  const clearFilters = () => {
    setFilterTag(null);
    setSelectedDate(null);
  };

  const refreshSessions = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const newSessions = mockStudySessions.map(session => {
        const updatedParticipants = session.currentParticipants + Math.floor(Math.random() * 3);
        return {
          ...session,
          currentParticipants: Math.min(updatedParticipants, session.maxParticipants),
        };
      });
      setSessions(newSessions);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refreshSessions();
    }, 30000);
    return () => clearInterval(interval);
  }, [isRefreshing]);

  const handleJoinSession = (sessionId: string) => {
    setJoinedSessions(prev => new Set(prev).add(sessionId));
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, currentParticipants: session.currentParticipants + 1 }
        : session
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-500" />
            Study Session Filter
          </h2>
          <p className="text-muted-foreground mt-1">Find and join study groups for exam preparation</p>
          {isRefreshing ? (
            <Badge variant="secondary" className="bg-teal-100 text-teal-700 mt-2">
              🔄 Refreshing...
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground mt-2">
              Last updated: {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAllSessions(!showAllSessions)}
          className="gap-2"
        >
          {showAllSessions ? 'Show Top 3' : 'Show All'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 dark:from-teal-950/30 dark:to-cyan-950/30">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock4 className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium">Filter by date:</span>
            </div>
            <div className="flex gap-2">
              {selectedDate ? (
                <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-teal-300">
                  {format(selectedDate, 'MMM dd, yyyy')}
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalender(!showCalender)}
                  className="gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Select Date
                </Button>
              )}
            </div>
            {(filterTag || selectedDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                Clear all filters
              </Button>
            )}
          </div>
          {showCalender && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-teal-200">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }, (_, i) => {
                  const date = new Date();
                  date.setDate(i + 1);
                  const isSelected = selectedDate && 
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();
                  
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDate(date);
                        setShowCalender(false);
                      }}
                      className={cn(
                        "p-2 text-sm rounded hover:bg-teal-100 transition-colors",
                        isSelected && "bg-teal-200 font-bold"
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-all",
                filterTag === tag
                  ? "bg-teal-500 text-white shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4">
        {displaySessions.map(session => (
          <StudySessionCard
            key={session.id}
            session={session}
            onJoin={handleJoinSession}
            isJoined={joinedSessions.has(session.id)}
          />
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No study sessions found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StudySessionCard({
  session,
  onJoin,
  isJoined
}: {
  session: StudySession;
  onJoin: (id: string) => void;
  isJoined: boolean;
}) {

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 border-l-4",
      session.isPinned && "border-l-teal-500",
      isJoined && "bg-teal-50 dark:bg-teal-950/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full border border-teal-200">
                {session.subject}
              </span>
              {session.isPinned && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  <BookMarked className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {getMeetingLabel(session.meetingType)}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight mb-1">
              {session.title}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {session.description}
            </CardDescription>
          </div>
          <div className="text-right ml-4">
            <div className={cn("text-sm font-medium", getTimeColor(session.date))}>
              {getTimeUntil(session.date)}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(session.date, 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-muted-foreground">
              {session.duration}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {session.tags.map(tag => (
              <span
                key={tag}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  tag.startsWith("#")
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span>{session.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Participants:</span>
              <span>{session.currentParticipants}/{session.maxParticipants}</span>
            </div>
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="truncate" title={session.location}>
                {session.location}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                {session.organizer.initials}
              </div>
              <div>
                <div className="text-sm font-medium">{session.organizer.name}</div>
                <div className="text-xs text-muted-foreground">{session.organizer.year}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {session.meetingLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(session.meetingLink, '_blank')}
                  className="gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Join
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onJoin(session.id)}
                disabled={isJoined}
                className={cn(
                  "gap-1",
                  isJoined && "bg-green-600 hover:bg-green-600"
                )}
              >
                {isJoined ? (
                  <>✓ Joined</>
                ) : (
                  <><Plus className="w-3 h-3" /> Join Session</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
