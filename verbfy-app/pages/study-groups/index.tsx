import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';

export default function StudyGroupsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { success, error } = useToast();
  
  const [groups, setGroups] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover' | 'create'>('my-groups');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    maxMembers: 10,
    level: 'B1',
    isPrivate: false,
    password: ''
  });

  useEffect(() => {
    loadStudyGroups();
  }, []);

  const loadStudyGroups = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the API
      // const response = await fetch('/api/study-groups');
      // setGroups(response.groups);
      
      // Simulated data for demonstration
      setGroups({
        myGroups: [
          {
            id: 1,
            name: 'Grammar Masters',
            description: 'Advanced grammar practice and discussion group',
            level: 'B2',
            memberCount: 8,
            maxMembers: 12,
            isPrivate: false,
            isOwner: true,
            lastActivity: '2 hours ago',
            nextSession: '2024-01-20T18:00:00Z',
            members: [
              { id: 1, name: 'Sarah Johnson', avatar: '👩‍🎓', role: 'owner', level: 'B2' },
              { id: 2, name: 'Mike Chen', avatar: '👨‍🎓', role: 'member', level: 'B1' },
              { id: 3, name: 'Emma Davis', avatar: '👩‍🎓', role: 'member', level: 'B2' }
            ],
            recentMessages: [
              { id: 1, user: 'Sarah Johnson', message: 'Great session today!', time: '2 hours ago' },
              { id: 2, user: 'Mike Chen', message: 'When is our next meeting?', time: '1 hour ago' }
            ]
          },
          {
            id: 2,
            name: 'Speaking Practice',
            description: 'Daily speaking practice and conversation',
            level: 'B1',
            memberCount: 5,
            maxMembers: 8,
            isPrivate: true,
            isOwner: false,
            lastActivity: '1 day ago',
            nextSession: '2024-01-21T19:00:00Z',
            members: [
              { id: 1, name: 'Lisa Wang', avatar: '👩‍🎓', role: 'owner', level: 'B2' },
              { id: 2, name: 'Alex Thompson', avatar: '👨‍🎓', role: 'member', level: 'B1' }
            ],
            recentMessages: [
              { id: 1, user: 'Lisa Wang', message: 'Tomorrow\'s topic: Travel experiences', time: '1 day ago' }
            ]
          }
        ],
        discoverGroups: [
          {
            id: 3,
            name: 'Vocabulary Builders',
            description: 'Learn new words and expand your vocabulary together',
            level: 'A2',
            memberCount: 15,
            maxMembers: 20,
            isPrivate: false,
            isOwner: false,
            lastActivity: '30 minutes ago',
            tags: ['vocabulary', 'beginner', 'daily']
          },
          {
            id: 4,
            name: 'Writing Workshop',
            description: 'Improve your writing skills with peer feedback',
            level: 'B1',
            memberCount: 6,
            maxMembers: 10,
            isPrivate: false,
            isOwner: false,
            lastActivity: '3 hours ago',
            tags: ['writing', 'feedback', 'intermediate']
          },
          {
            id: 5,
            name: 'Test Prep Squad',
            description: 'Prepare for CEFR tests together',
            level: 'B2',
            memberCount: 12,
            maxMembers: 15,
            isPrivate: false,
            isOwner: false,
            lastActivity: '1 hour ago',
            tags: ['test-prep', 'cefr', 'advanced']
          }
        ],
        recommendedGroups: [
          {
            id: 6,
            name: 'Reading Club',
            description: 'Read and discuss English literature',
            level: 'B1',
            memberCount: 8,
            maxMembers: 12,
            isPrivate: false,
            isOwner: false,
            lastActivity: '4 hours ago',
            tags: ['reading', 'literature', 'discussion']
          }
        ]
      });
    } catch (err) {
      error('Failed to load study groups');
      console.error('Error loading study groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      // This would need to be implemented in the API
      // await fetch('/api/study-groups', { method: 'POST', body: JSON.stringify(newGroup) });
      success('Study group created successfully!');
      setShowCreateGroup(false);
      setNewGroup({ name: '', description: '', maxMembers: 10, level: 'B1', isPrivate: false, password: '' });
      loadStudyGroups(); // Reload to get updated data
    } catch (err) {
      error('Failed to create study group');
      console.error('Error creating study group:', err);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      // This would need to be implemented in the API
      // await fetch(`/api/study-groups/${groupId}/join`, { method: 'POST' });
      success('Joined study group successfully!');
      loadStudyGroups(); // Reload to get updated data
    } catch (err) {
      error('Failed to join study group');
      console.error('Error joining study group:', err);
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      // This would need to be implemented in the API
      // await fetch(`/api/study-groups/${groupId}/leave`, { method: 'POST' });
      success('Left study group successfully!');
      loadStudyGroups(); // Reload to get updated data
    } catch (err) {
      error('Failed to leave study group');
      console.error('Error leaving study group:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'A1': 'bg-red-100 text-red-800',
      'A2': 'bg-orange-100 text-orange-800',
      'B1': 'bg-yellow-100 text-yellow-800',
      'B2': 'bg-green-100 text-green-800',
      'C1': 'bg-blue-100 text-blue-800',
      'C2': 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!groups) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No study groups available</h2>
          <p className="text-gray-600 mb-4">Create or join a study group to start learning together.</p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Group
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
      <Head>
        <title>Study Groups - Verbfy</title>
      </Head>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Groups</h1>
              <p className="text-gray-600">
                Learn together with peers and practice English in a collaborative environment
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Group
              </button>
              <button
                onClick={() => router.push('/personalized-curriculum')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Curriculum
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Groups</p>
                <p className="text-2xl font-bold text-gray-900">{groups.myGroups.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groups.myGroups.reduce((total: number, group: any) => total + group.memberCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">👨‍🎓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groups.myGroups.filter((g: any) => new Date(g.nextSession) > new Date()).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Groups Owned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groups.myGroups.filter((g: any) => g.isOwner).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">👑</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'my-groups', label: 'My Groups', count: groups.myGroups.length },
                { id: 'discover', label: 'Discover', count: groups.discoverGroups.length },
                { id: 'create', label: 'Create Group', count: 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'my-groups' && (
          <div className="space-y-6">
            {groups.myGroups.map((group: any) => (
              <div key={group.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(group.level)}`}>
                        {group.level}
                      </span>
                      {group.isPrivate && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          🔒 Private
                        </span>
                      )}
                      {group.isOwner && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          👑 Owner
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{group.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>👥 {group.memberCount}/{group.maxMembers} members</span>
                      <span>🕒 Last activity: {group.lastActivity}</span>
                      {group.nextSession && (
                        <span>📅 Next session: {formatDate(group.nextSession)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/study-groups/${group.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Group
                    </button>
                    {!group.isOwner && (
                      <button
                        onClick={() => handleLeaveGroup(group.id)}
                        className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </div>

                {/* Members */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Members</h4>
                  <div className="flex items-center space-x-2">
                    {group.members.slice(0, 5).map((member: any) => (
                      <div key={member.id} className="flex items-center space-x-1">
                        <span className="text-lg">{member.avatar}</span>
                        <span className="text-xs text-gray-600">{member.name}</span>
                      </div>
                    ))}
                    {group.members.length > 5 && (
                      <span className="text-xs text-gray-500">+{group.members.length - 5} more</span>
                    )}
                  </div>
                </div>

                {/* Recent Messages */}
                {group.recentMessages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Messages</h4>
                    <div className="space-y-1">
                      {group.recentMessages.slice(0, 2).map((message: any) => (
                        <div key={message.id} className="text-sm text-gray-600">
                          <span className="font-medium">{message.user}:</span> {message.message}
                          <span className="text-gray-400 ml-2">{message.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* Recommended Groups */}
            {groups.recommendedGroups.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.recommendedGroups.map((group: any) => (
                    <div key={group.id} className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(group.level)}`}>
                          {group.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>👥 {group.memberCount}/{group.maxMembers}</span>
                        <span>🕒 {group.lastActivity}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {group.tags.map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Join Group
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Discoverable Groups */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Groups</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.discoverGroups.map((group: any) => (
                  <div key={group.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(group.level)}`}>
                        {group.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>👥 {group.memberCount}/{group.maxMembers}</span>
                      <span>🕒 {group.lastActivity}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {group.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Join Group
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create a New Study Group</h3>
            <p className="text-gray-600 mb-6">
              Create a study group to learn together with other students. You can make it public or private.
            </p>
            
            <button
              onClick={() => setShowCreateGroup(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Study Group
            </button>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Study Group</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="Describe your study group"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEFR Level</label>
                  <select
                    value={newGroup.level}
                    onChange={(e) => setNewGroup({ ...newGroup, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Mastery</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Members</label>
                  <select
                    value={newGroup.maxMembers}
                    onChange={(e) => setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 members</option>
                    <option value={10}>10 members</option>
                    <option value={15}>15 members</option>
                    <option value={20}>20 members</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newGroup.isPrivate}
                    onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
                    Make this group private
                  </label>
                </div>
                
                {newGroup.isPrivate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={newGroup.password}
                      onChange={(e) => setNewGroup({ ...newGroup, password: e.target.value })}
                      placeholder="Enter group password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 