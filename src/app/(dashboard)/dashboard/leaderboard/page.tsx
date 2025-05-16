'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "@/lib/motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  // In a real implementation, these would be fetched from Supabase
  const topUsers = [
    { id: '1', name: 'Alex Johnson', quizzesTaken: 45, avgScore: 85, avatar: '' },
    { id: '2', name: 'Maria Garcia', quizzesTaken: 38, avgScore: 82, avatar: '' },
    { id: '3', name: 'Sam Wilson', quizzesTaken: 42, avgScore: 78, avatar: '' },
    { id: '4', name: 'Taylor Swift', quizzesTaken: 30, avgScore: 76, avatar: '' },
    { id: '5', name: 'Jordan Lee', quizzesTaken: 25, avgScore: 74, avatar: '' },
  ];

  const topCreators = [
    { id: '1', name: 'Priya Patel', quizzesCreated: 12, totalPlayers: 450, avatar: '' },
    { id: '2', name: 'Marcus Kim', quizzesCreated: 8, totalPlayers: 380, avatar: '' },
    { id: '3', name: 'Sophia Chen', quizzesCreated: 7, totalPlayers: 310, avatar: '' },
    { id: '4', name: 'Carlos Mendez', quizzesCreated: 6, totalPlayers: 280, avatar: '' },
    { id: '5', name: 'Emily Johnson', quizzesCreated: 5, totalPlayers: 220, avatar: '' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
      </div>
      
      <Tabs defaultValue="players" className="w-full">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="players" className="data-[state=active]:bg-gray-700">Top Players</TabsTrigger>
          <TabsTrigger value="creators" className="data-[state=active]:bg-gray-700">Top Creators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="players" className="pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Top Quiz Players</CardTitle>
                <CardDescription className="text-gray-400">
                  Players with the highest average scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topUsers.map((user, index) => (
                    <motion.div 
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-900/20 border border-yellow-600/30' : 
                        index === 1 ? 'bg-gray-700/50 border border-gray-600/30' : 
                        index === 2 ? 'bg-amber-900/20 border border-amber-700/30' : 
                        'bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 text-lg font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10 border border-gray-700">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-purple-800 text-white">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-400">{user.quizzesTaken} quizzes taken</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-400">{user.avgScore}%</div>
                        <div className="text-sm text-gray-400">avg. score</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="creators" className="pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Top Quiz Creators</CardTitle>
                <CardDescription className="text-gray-400">
                  Creators with the most popular quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topCreators.map((creator, index) => (
                    <motion.div 
                      key={creator.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-900/20 border border-yellow-600/30' : 
                        index === 1 ? 'bg-gray-700/50 border border-gray-600/30' : 
                        index === 2 ? 'bg-amber-900/20 border border-amber-700/30' : 
                        'bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 text-lg font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10 border border-gray-700">
                          <AvatarImage src={creator.avatar} />
                          <AvatarFallback className="bg-purple-800 text-white">
                            {getInitials(creator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{creator.name}</div>
                          <div className="text-sm text-gray-400">{creator.quizzesCreated} quizzes created</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-400">{creator.totalPlayers}</div>
                        <div className="text-sm text-gray-400">total players</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 