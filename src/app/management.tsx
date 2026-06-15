import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform } from 'react-native';
import { DatabaseService } from '@/services/db';
import { User, Module, AuditLog } from '@/services/mockData';
import GlassCard from '@/components/GlassCard';
import DependencyGraph from '@/components/DependencyGraph';

export default function ManagementScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const unsubscribeUser = DatabaseService.subscribeCurrentUser((user) => {
      setCurrentUser(user);
    });

    const unsubscribeModules = DatabaseService.subscribeModules((mods) => {
      setModules(mods);
    });

    const unsubscribeLogs = DatabaseService.subscribeAuditLogs((logs) => {
      setAuditLogs(logs);
    });

    return () => {
      unsubscribeUser();
      unsubscribeModules();
      unsubscribeLogs();
    };
  }, []);

  if (!currentUser) return null;

  // RBAC Access Control Guard
  if (currentUser.role !== 'head') {
    return (
      <View style={styles.restrictedContainer}>
        <GlassCard style={styles.restrictedCard}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.restrictedTitle}>Access Denied</Text>
          <Text style={styles.restrictedText}>
            This view is restricted to Organization Heads (Admins). Individual department members do not have visibility permissions for this portal.
          </Text>
        </GlassCard>
      </View>
    );
  }

  // Delay origin bottleneck analyzer
  const getDelayAnalysis = () => {
    const modA = modules.find(m => m.id === 'module_a');
    const modB = modules.find(m => m.id === 'module_b');
    const modC = modules.find(m => m.id === 'module_c');

    if (!modA || !modB || !modC) return { status: 'loading', text: 'Analyzing dependency tree...' };

    if (modA.progress < 100) {
      return {
        status: 'critical',
        text: `Root Bottleneck Identified: ${modA.name} is at ${modA.progress}% completion. Since they have not completed their checklist, they are stalling the handshake transition to ${modB.name}, causing a cascading delay on ${modC.name}.`,
        module: modA.name,
        color: '#EF4444'
      };
    }

    if (modB.progress < 100) {
      return {
        status: 'warning',
        text: `Active Bottleneck Identified: ${modA.name} has completed deliverables and handed over. However, ${modB.name} is currently at ${modB.progress}% progress, blocking the transition of deliverables to ${modC.name}.`,
        module: modB.name,
        color: '#F59E0B'
      };
    }

    if (modC.progress < 100) {
      return {
        status: 'info',
        text: `${modA.name} and ${modB.name} have successfully completed their tasks and handshakes. The pipeline is currently processing deliverables inside ${modC.name} (${modC.progress}%).`,
        module: modC.name,
        color: '#8B5CF6'
      };
    }

    return {
      status: 'clear',
      text: 'Workflow Pipeline Clear: All modules have completed their deliverables and successfully verified handovers. No active delays identified.',
      module: 'None',
      color: '#10B981'
    };
  };

  const analysis = getDelayAnalysis();

  const getLogColor = (type: string) => {
    switch (type) {
      case 'handshake_accepted': return '#10B981';
      case 'handshake_rejected': return '#EF4444';
      case 'handshake_request': return '#F59E0B';
      case 'file_version_update': return '#8B5CF6';
      case 'progress_change': return '#3B82F6';
      default: return '#64748B';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Executive Management Panel</Text>
        <Text style={styles.subText}>
          Bird's-eye view into cross-department metrics. Dynamically maps timelines and pinpoints active cascading delays.
        </Text>
      </View>

      {/* Dependency Map */}
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Pipeline Dependency Map</Text>
        <Text style={styles.sectionSubtitle}>Shows real-time connections, active bottlenecks, and handover flows.</Text>
        <DependencyGraph modules={modules} />
      </GlassCard>

      {/* Delay Analysis Block */}
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Bottleneck Analysis Ledger</Text>
        <View style={[styles.analysisBox, { borderLeftColor: analysis.color || '#334155' }]}>
          <Text style={[styles.analysisStatusText, { color: analysis.color }]}>
            {analysis.status?.toUpperCase() === 'CRITICAL' ? '⚠️ CRITICAL DELAY ORIGIN' : 
             analysis.status?.toUpperCase() === 'WARNING' ? '⚡ ACTIVE BOTTLENECK' : 
             analysis.status?.toUpperCase() === 'INFO' ? 'ℹ️ PIPELINE RUNNING' : '✓ ALL CLEAR'}
          </Text>
          <Text style={styles.analysisDescText}>{analysis.text}</Text>
        </View>
      </GlassCard>

      {/* Global Audit Ledger */}
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Real-time Global Audit Ledger</Text>
        <Text style={styles.sectionSubtitle}>Immutable timeline of all cross-module actions, task completions, and handovers.</Text>
        
        <View style={styles.logList}>
          {auditLogs.length === 0 ? (
            <Text style={styles.emptyText}>No logs recorded yet.</Text>
          ) : (
            auditLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logMetaRow}>
                  <View style={[styles.logTypeBadge, { backgroundColor: getLogColor(log.type) + '15', borderColor: getLogColor(log.type) }]}>
                    <Text style={[styles.logTypeText, { color: getLogColor(log.type) }]}>
                      {log.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.logTimeText}>
                    {new Date(log.timestamp).toLocaleString()} • Actor: {log.actor}
                  </Text>
                </View>
                <Text style={styles.logDescText}>{log.description}</Text>
              </View>
            ))
          )}
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#090D16',
    flexGrow: 1,
    paddingTop: 96,
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
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  analysisBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  analysisStatusText: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  analysisDescText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  logList: {
    gap: 14,
  },
  logItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 14,
    borderRadius: 8,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logTypeBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  logTypeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  logTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  logDescText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  restrictedContainer: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  restrictedCard: {
    maxWidth: 400,
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  restrictedTitle: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  restrictedText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
