import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import { DatabaseService } from '@/services/db';
import { User, Module, ChecklistItem, AuditLog } from '@/services/mockData';
import GlassCard from '@/components/GlassCard';
import ProgressBar from '@/components/ProgressBar';

export default function DashboardScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myModule, setMyModule] = useState<Module | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    // Current User Subscription
    const unsubscribeUser = DatabaseService.subscribeCurrentUser((user) => {
      setCurrentUser(user);
    });

    // Modules Subscription
    const unsubscribeModules = DatabaseService.subscribeModules((allMods) => {
      setModules(allMods);
    });

    // Audit Log Subscription
    const unsubscribeLogs = DatabaseService.subscribeAuditLogs((logs) => {
      setRecentLogs(logs.slice(0, 5)); // show top 5 logs
    });

    return () => {
      unsubscribeUser();
      unsubscribeModules();
      unsubscribeLogs();
    };
  }, []);

  // Update myModule whenever currentUser or modules list changes
  useEffect(() => {
    if (currentUser && currentUser.module !== 'None') {
      const foundMod = modules.find(m => m.id === currentUser.module);
      setMyModule(foundMod || null);
    } else {
      setMyModule(null);
    }
  }, [currentUser, modules]);

  // Subscribe to checklist items for current user's module
  useEffect(() => {
    if (currentUser && currentUser.module !== 'None') {
      const unsubscribeChecklist = DatabaseService.subscribeChecklist(
        currentUser.module,
        (items) => {
          setChecklist(items);
        }
      );
      return () => unsubscribeChecklist();
    } else {
      setChecklist([]);
    }
  }, [currentUser]);

  const handleToggleTodo = async (id: string) => {
    await DatabaseService.toggleChecklistItem(id);
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !currentUser || currentUser.module === 'None') return;
    await DatabaseService.addChecklistItem(currentUser.module, newTodo.trim());
    setNewTodo('');
  };

  const handleDeleteTodo = async (id: string) => {
    await DatabaseService.deleteChecklistItem(id);
  };

  const handleUpdateStatus = async (status: 'on_track' | 'delayed' | 'blocked') => {
    if (!myModule) return;
    await DatabaseService.updateModuleStatus(myModule.id, status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return '#10B981'; // green
      case 'delayed': return '#F59E0B'; // orange
      case 'blocked': return '#EF4444'; // red
      default: return '#64748B';
    }
  };

  if (!currentUser) return null;

  // --- RENDERING ORGANIZATION HEAD BIRD'S EYE DASHBOARD ---
  if (currentUser.role === 'head') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titleText}>Executive Briefing Room</Text>
          <Text style={styles.subText}>Organization-wide status report, benchmarks, and activity tracking.</Text>
        </View>

        {/* Modules status overview */}
        <View style={styles.grid}>
          {modules.map((mod) => (
            <GlassCard key={mod.id} style={styles.statCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.statCardTitle}>{mod.name}</Text>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(mod.status) }]} />
              </View>
              <Text style={styles.ownerText}>Owner: {mod.owner}</Text>
              <ProgressBar progress={mod.progress} status={mod.status} showLabel={false} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Completion Progress:</Text>
                <Text style={[styles.statValue, { color: getStatusColor(mod.status) }]}>{mod.progress}%</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Prerequisites:</Text>
                <Text style={styles.statValue}>
                  {mod.dependencies.length > 0 ? mod.dependencies.map(d => modules.find(m => m.id === d)?.name).join(', ') : 'None'}
                </Text>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Global Recent Activity Log */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Global Audit Log</Text>
          <Text style={styles.sectionSubtitle}>Verifiable ledger of all task completions, handshake submissions, approvals, and bottlenecks.</Text>
          <View style={styles.logList}>
            {recentLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <Text style={styles.logMeta}>{new Date(log.timestamp).toLocaleTimeString()} - {log.actor}</Text>
                <Text style={styles.logDesc}>{log.description}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </ScrollView>
    );
  }

  // --- RENDERING DEPARTMENT MEMBER DASHBOARD ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {myModule && (
        <>
          <View style={styles.header}>
            <Text style={styles.titleText}>{myModule.name} Command Center</Text>
            <Text style={styles.subText}>{myModule.description}</Text>
          </View>

          {/* Module Progress Card */}
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Department Progress</Text>
            <ProgressBar progress={myModule.progress} status={myModule.status} />

            <View style={styles.statusButtonsContainer}>
              <Text style={styles.statusSelectorLabel}>Update Current Status:</Text>
              <View style={styles.statusButtons}>
                {(['on_track', 'delayed', 'blocked'] as const).map((s) => (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [
                      styles.statusSelectBtn,
                      myModule.status === s && { backgroundColor: getStatusColor(s) + '20', borderColor: getStatusColor(s) },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleUpdateStatus(s)}
                  >
                    <Text style={[styles.statusSelectText, { color: myModule.status === s ? getStatusColor(s) : '#64748B' }]}>
                      {s.toUpperCase().replace('_', ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </GlassCard>

          {/* Internal Task Checklist */}
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Internal Task Checklist</Text>
            <Text style={styles.sectionSubtitle}>
              Check off deliverables to advance your department's progress. Handshakes can be requested once all tasks are complete.
            </Text>

            {/* Todo Input */}
            <View style={styles.todoInputRow}>
              <TextInput
                style={styles.todoInput}
                placeholder="Add new deliverable step..."
                placeholderTextColor="#64748B"
                value={newTodo}
                onChangeText={setNewTodo}
              />
              <Pressable style={styles.todoAddBtn} onPress={handleAddTodo}>
                <Text style={styles.todoAddBtnText}>Add</Text>
              </Pressable>
            </View>

            {/* Checklist items */}
            <View style={styles.checklist}>
              {checklist.length === 0 ? (
                <Text style={styles.emptyText}>No tasks defined. Add one above.</Text>
              ) : (
                checklist.map((item) => (
                  <View key={item.id} style={styles.checkItem}>
                    <Pressable
                      style={styles.checkIndicator}
                      onPress={() => handleToggleTodo(item.id)}
                    >
                      <View style={[styles.checkBox, item.completed && styles.checkBoxCompleted]}>
                        {item.completed && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                      <Text style={[styles.checkText, item.completed && styles.checkTextCompleted]}>
                        {item.text}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.todoDeleteBtn} onPress={() => handleDeleteTodo(item.id)}>
                      <Text style={styles.todoDeleteText}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </GlassCard>

          {/* Recent Activity Log */}
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Department History</Text>
            <View style={styles.logList}>
              {recentLogs
                .filter(l => l.moduleId === myModule.id)
                .map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <Text style={styles.logMeta}>{new Date(log.timestamp).toLocaleTimeString()} - {log.actor}</Text>
                    <Text style={styles.logDesc}>{log.description}</Text>
                  </View>
                ))}
              {recentLogs.filter(l => l.moduleId === myModule.id).length === 0 && (
                <Text style={styles.emptyText}>No recent activities recorded.</Text>
              )}
            </View>
          </GlassCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#090D16',
    flexGrow: 1,
    paddingTop: 96, // Height of nav bar
  },
  header: {
    marginBottom: 24,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 260,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ownerText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionCard: {
    marginBottom: 24,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  statusButtonsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  statusSelectorLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusSelectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  statusSelectText: {
    fontSize: 11,
    fontWeight: '700',
  },
  todoInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  todoInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  todoAddBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  todoAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  checklist: {
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 12,
  },
  checkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  checkTextCompleted: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  todoDeleteBtn: {
    padding: 6,
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  todoDeleteText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  logList: {
    gap: 12,
  },
  logItem: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  logMeta: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  logDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
