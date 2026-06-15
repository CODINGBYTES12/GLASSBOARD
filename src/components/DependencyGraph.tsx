import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import GlassCard from './GlassCard';

interface ModuleNode {
  id: string;
  name: string;
  progress: number;
  status: 'on_track' | 'delayed' | 'blocked';
  dependencies: string[];
  owner: string;
}

interface DependencyGraphProps {
  modules: ModuleNode[];
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ modules }) => {
  // Sort modules into hierarchical order: A -> B -> C
  const moduleA = modules.find(m => m.id === 'module_a');
  const moduleB = modules.find(m => m.id === 'module_b');
  const moduleC = modules.find(m => m.id === 'module_c');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return '#10B981'; // Green
      case 'delayed': return '#F59E0B'; // Orange
      case 'blocked': return '#EF4444'; // Red
      default: return '#64748B';
    }
  };

  const getConnectorStyle = (fromNode?: ModuleNode, toNode?: ModuleNode) => {
    if (!fromNode || !toNode) return styles.connectorLineInactive;
    
    // If the prerequisite (fromNode) is not 100%, the connector is blocked/delayed
    if (fromNode.progress < 100) {
      return fromNode.status === 'delayed' ? styles.connectorLineDelayed : styles.connectorLineBlocked;
    }
    
    return styles.connectorLineActive;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.graphWrapper}>
        {/* Render Node A */}
        {moduleA && (
          <View style={styles.nodeContainer}>
            <GlassCard style={[styles.nodeCard, { borderColor: getStatusColor(moduleA.status) }]}>
              <View style={styles.badgeRow}>
                <Text style={styles.nodeOwner}>{moduleA.owner}</Text>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(moduleA.status) }]} />
              </View>
              <Text style={styles.nodeTitle}>{moduleA.name}</Text>
              <Text style={styles.nodeProgress}>{moduleA.progress}% Complete</Text>
              <Text style={styles.nodeDesc}>Root Provider (No prerequisites)</Text>
            </GlassCard>
          </View>
        )}

        {/* Connector Line A -> B */}
        <View style={styles.connectorContainer}>
          <View style={[styles.connectorLine, getConnectorStyle(moduleA, moduleB)]} />
          <View style={styles.arrowHead} />
          {moduleA && moduleA.progress < 100 && (
            <Text style={styles.connectorLabel}>Awaiting Handover</Text>
          )}
        </View>

        {/* Render Node B */}
        {moduleB && (
          <View style={styles.nodeContainer}>
            <GlassCard style={[styles.nodeCard, { borderColor: getStatusColor(moduleB.status) }]}>
              <View style={styles.badgeRow}>
                <Text style={styles.nodeOwner}>{moduleB.owner}</Text>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(moduleB.status) }]} />
              </View>
              <Text style={styles.nodeTitle}>{moduleB.name}</Text>
              <Text style={styles.nodeProgress}>{moduleB.progress}% Complete</Text>
              <Text style={styles.nodeDesc}>Requires: Frontend Core</Text>
            </GlassCard>
          </View>
        )}

        {/* Connector Line B -> C */}
        <View style={styles.connectorContainer}>
          <View style={[styles.connectorLine, getConnectorStyle(moduleB, moduleC)]} />
          <View style={styles.arrowHead} />
          {moduleB && moduleB.progress < 100 && (
            <Text style={styles.connectorLabel}>Prerequisite Delayed</Text>
          )}
        </View>

        {/* Render Node C */}
        {moduleC && (
          <View style={styles.nodeContainer}>
            <GlassCard style={[styles.nodeCard, { borderColor: getStatusColor(moduleC.status) }]}>
              <View style={styles.badgeRow}>
                <Text style={styles.nodeOwner}>{moduleC.owner}</Text>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(moduleC.status) }]} />
              </View>
              <Text style={styles.nodeTitle}>{moduleC.name}</Text>
              <Text style={styles.nodeProgress}>{moduleC.progress}% Complete</Text>
              <Text style={styles.nodeDesc}>Requires: API Gateway & Auth</Text>
            </GlassCard>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeContainer: {
    width: 220,
  },
  nodeCard: {
    borderWidth: 1.5,
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeOwner: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nodeTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  nodeProgress: {
    color: '#8B5CF6', // Purple
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  nodeDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 14,
  },
  connectorContainer: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: -5,
  },
  connectorLine: {
    height: 3,
    width: '100%',
  },
  connectorLineActive: {
    backgroundColor: '#10B981', // Solid Green
  },
  connectorLineDelayed: {
    backgroundColor: '#F59E0B', // Amber
    borderStyle: 'dashed',
  },
  connectorLineBlocked: {
    backgroundColor: '#EF4444', // Red
    borderStyle: 'dashed',
  },
  connectorLineInactive: {
    backgroundColor: '#334155',
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: '#64748B',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
  },
  connectorLabel: {
    position: 'absolute',
    top: 8,
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    backgroundColor: '#0F172A',
    paddingHorizontal: 4,
    borderRadius: 2,
    textAlign: 'center',
    width: 90,
  },
});

export default DependencyGraph;
