import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Platform, Modal, Image } from 'react-native';
import { DatabaseService } from '@/services/db';
import { User, Module, Handshake } from '@/services/mockData';
import GlassCard from '@/components/GlassCard';

export default function HandshakesScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [handshakes, setHandshakes] = useState<Handshake[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'send' | 'archive'>('queue');

  // Form State
  const [targetModuleId, setTargetModuleId] = useState('');
  const [comments, setComments] = useState('');
  const [proofName, setProofName] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Reject State
  const [rejectingHandshakeId, setRejectingHandshakeId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const unsubscribeUser = DatabaseService.subscribeCurrentUser((user) => {
      setCurrentUser(user);
    });

    const unsubscribeModules = DatabaseService.subscribeModules((mods) => {
      setModules(mods);
    });

    const unsubscribeHandshakes = DatabaseService.subscribeHandshakes((hs) => {
      setHandshakes(hs);
    });

    return () => {
      unsubscribeUser();
      unsubscribeModules();
      unsubscribeHandshakes();
    };
  }, []);

  // Set default target module
  useEffect(() => {
    if (currentUser) {
      if (currentUser.module === 'module_a') {
        setTargetModuleId('module_b');
      } else if (currentUser.module === 'module_b') {
        setTargetModuleId('module_c');
      }
    }
  }, [currentUser]);

  const handleSimulateProof = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setProofName(`verifiable_proof_doc_${randomId}.png`);
    setProofUrl(`https://picsum.photos/id/${randomId % 200}/600/400`);
  };

  const handleSendHandshake = async () => {
    if (!currentUser || currentUser.module === 'None') return;
    setFormError(null);
    setFormSuccess(null);

    if (!targetModuleId) {
      setFormError('Please select a target department.');
      return;
    }
    if (!comments.trim()) {
      setFormError('Please provide transition comments.');
      return;
    }
    if (!proofName || !proofUrl) {
      setFormError('Please generate or attach a proof of delivery document.');
      return;
    }

    try {
      await DatabaseService.sendHandshake(
        currentUser.module,
        targetModuleId,
        comments.trim(),
        proofName,
        proofUrl
      );
      setComments('');
      setProofName('');
      setProofUrl('');
      setFormSuccess('Handshake request submitted successfully! Pending approval.');
      setTimeout(() => setFormSuccess(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Submission failed.');
    }
  };

  const handleAccept = async (id: string) => {
    await DatabaseService.respondToHandshake(id, 'accepted');
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingHandshakeId(id);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectingHandshakeId) return;
    if (!rejectionReason.trim()) {
      alert('A reason is required to reject a handover.');
      return;
    }
    await DatabaseService.respondToHandshake(rejectingHandshakeId, 'rejected', rejectionReason.trim());
    setRejectingHandshakeId(null);
    setRejectionReason('');
  };

  const getModuleName = (id: string) => {
    return modules.find(m => m.id === id)?.name || id;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  if (!currentUser) return null;

  // Filters
  const myModuleId = currentUser.module;
  const isHead = currentUser.role === 'head';

  // Queue: Handshakes where I am the receiver (toModule === myModuleId) and status is pending
  const incomingQueue = handshakes.filter(h => 
    (isHead || h.toModule === myModuleId) && h.status === 'pending'
  );

  // Archive: All accepted/rejected handshakes, plus pending sent handshakes
  const archiveList = handshakes.filter(h => 
    isHead || 
    h.fromModule === myModuleId || 
    h.toModule === myModuleId
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Digital Handshake Portal</Text>
        <Text style={styles.subText}>
          Enforce formal, verifiable transition protocols between departments. Requires proof uploads and recipient sign-offs.
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'queue' && styles.tabBtnActive]}
          onPress={() => setActiveTab('queue')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'queue' && styles.tabBtnTextActive]}>
            Incoming Queue ({incomingQueue.length})
          </Text>
        </Pressable>
        {!isHead && (
          <Pressable
            style={[styles.tabBtn, activeTab === 'send' && styles.tabBtnActive]}
            onPress={() => setActiveTab('send')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'send' && styles.tabBtnTextActive]}>
              Initiate Handover
            </Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.tabBtn, activeTab === 'archive' && styles.tabBtnActive]}
          onPress={() => setActiveTab('archive')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'archive' && styles.tabBtnTextActive]}>
            Transition Archive
          </Text>
        </Pressable>
      </View>

      {/* Tab Contents */}
      {activeTab === 'queue' && (
        <View style={styles.listContainer}>
          {incomingQueue.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No pending incoming handshake requests found.</Text>
            </GlassCard>
          ) : (
            incomingQueue.map((hs) => (
              <GlassCard key={hs.id} style={styles.handshakeCard}>
                <View style={styles.hsHeader}>
                  <Text style={styles.hsTitle}>
                    From: <Text style={styles.moduleHighlight}>{getModuleName(hs.fromModule)}</Text>
                  </Text>
                  <View style={[styles.statusBadge, { borderColor: getStatusColor(hs.status), backgroundColor: getStatusColor(hs.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(hs.status) }]}>{hs.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.hsTime}>Submitted: {new Date(hs.timestamp).toLocaleString()}</Text>
                
                <Text style={styles.labelTitle}>Handover Comments:</Text>
                <Text style={styles.commentsText}>"{hs.comments}"</Text>

                <Text style={styles.labelTitle}>Visual Proof of Work:</Text>
                <View style={styles.proofBox}>
                  <Text style={styles.proofNameText}>📄 {hs.proofName}</Text>
                  {hs.proofUrl && (
                    <Image source={{ uri: hs.proofUrl }} style={styles.proofPreview} resizeMode="cover" />
                  )}
                </View>

                {/* Recipient Controls */}
                {!isHead && hs.toModule === myModuleId && (
                  <View style={styles.actionRow}>
                    <Pressable style={styles.acceptBtn} onPress={() => handleAccept(hs.id)}>
                      <Text style={styles.btnText}>Accept Transition</Text>
                    </Pressable>
                    <Pressable style={styles.rejectBtn} onPress={() => handleOpenRejectModal(hs.id)}>
                      <Text style={styles.btnText}>Reject</Text>
                    </Pressable>
                  </View>
                )}
              </GlassCard>
            ))
          )}
        </View>
      )}

      {activeTab === 'send' && !isHead && (
        <GlassCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Request Cross-Module Handover</Text>
          <Text style={styles.sectionSubtitle}>
            Submit your deliverables to the next module in the pipeline. Requires proof of completion.
          </Text>

          {formError && <Text style={styles.errorText}>{formError}</Text>}
          {formSuccess && <Text style={styles.successText}>{formSuccess}</Text>}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Target Department:</Text>
            <View style={styles.mockSelector}>
              <Text style={styles.mockSelectorText}>
                {targetModuleId ? getModuleName(targetModuleId) : 'No dependent module'}
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Transition Comments / Notes:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detail what has been accomplished, API routes completed, spec files uploaded..."
              placeholderTextColor="#64748B"
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Visual Proof of Delivery:</Text>
            {proofName ? (
              <View style={styles.proofAttached}>
                <Text style={styles.proofAttachedText}>✓ {proofName}</Text>
                <Image source={{ uri: proofUrl }} style={styles.proofPreview} />
                <Pressable onPress={() => { setProofName(''); setProofUrl(''); }}>
                  <Text style={styles.removeProofText}>Remove file</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.uploadSimBtn} onPress={handleSimulateProof}>
                <Text style={styles.uploadSimBtnText}>📷 Simulate Proof Capture (Photo/Doc)</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.submitBtn} onPress={handleSendHandshake}>
            <Text style={styles.submitBtnText}>Submit Handshake Request</Text>
          </Pressable>
        </GlassCard>
      )}

      {activeTab === 'archive' && (
        <View style={styles.listContainer}>
          {archiveList.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No historical handshake records available.</Text>
            </GlassCard>
          ) : (
            archiveList.map((hs) => (
              <GlassCard key={hs.id} style={styles.handshakeCard}>
                <View style={styles.hsHeader}>
                  <Text style={styles.hsTitle}>
                    {getModuleName(hs.fromModule)} ➔ {getModuleName(hs.toModule)}
                  </Text>
                  <View style={[styles.statusBadge, { borderColor: getStatusColor(hs.status), backgroundColor: getStatusColor(hs.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(hs.status) }]}>{hs.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.hsTime}>Submitted: {new Date(hs.timestamp).toLocaleString()}</Text>
                
                {hs.handledAt && (
                  <Text style={styles.hsTime}>
                    {hs.status === 'accepted' ? 'Accepted' : 'Rejected'} at: {new Date(hs.handledAt).toLocaleString()} by {hs.handledBy}
                  </Text>
                )}

                <Text style={styles.labelTitle}>Comments:</Text>
                <Text style={styles.commentsText}>"{hs.comments}"</Text>

                {hs.status === 'rejected' && hs.rejectionReason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
                    <Text style={styles.rejectionText}>"{hs.rejectionReason}"</Text>
                  </View>
                )}

                <Text style={styles.labelTitle}>Proof Asset:</Text>
                <Text style={styles.fileNameLink}>📄 {hs.proofName}</Text>
              </GlassCard>
            ))
          )}
        </View>
      )}

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectingHandshakeId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectingHandshakeId(null)}
      >
        <View style={styles.modalBg}>
          <GlassCard style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Handover Request</Text>
            <Text style={styles.modalSubtitle}>Please provide a clear justification detailing what deliverables are missing or require changes.</Text>
            
            <TextInput
              style={[styles.input, styles.modalInput]}
              placeholder="Describe missing items, errors, or feedback..."
              placeholderTextColor="#64748B"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalSubmitBtn} onPress={handleRejectSubmit}>
                <Text style={styles.btnText}>Submit Rejection</Text>
              </Pressable>
              <Pressable style={styles.modalCancelBtn} onPress={() => setRejectingHandshakeId(null)}>
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  tabBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#8B5CF6',
  },
  listContainer: {
    gap: 20,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  handshakeCard: {
    padding: 20,
  },
  hsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hsTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
  },
  moduleHighlight: {
    color: '#8B5CF6',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  hsTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  labelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 6,
  },
  commentsText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  proofBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  proofNameText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '600',
  },
  proofPreview: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  formCard: {
    padding: 24,
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
    marginBottom: 20,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  mockSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  mockSelectorText: {
    color: '#8B5CF6',
    fontWeight: '700',
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  uploadSimBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  uploadSimBtnText: {
    color: '#8B5CF6',
    fontWeight: '700',
    fontSize: 13,
  },
  proofAttached: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    alignItems: 'center',
  },
  proofAttachedText: {
    color: '#10B981',
    fontWeight: '700',
  },
  removeProofText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  submitBtn: {
    backgroundColor: '#8B5CF6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectionBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  rejectionTitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectionText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  fileNameLink: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  modalInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  successText: {
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '600',
  },
});
