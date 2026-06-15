import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Platform, Modal } from 'react-native';
import { DatabaseService } from '@/services/db';
import { User, SharedFile, Module } from '@/services/mockData';
import GlassCard from '@/components/GlassCard';

export default function FilesScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [modules, setModules] = useState<Module[]>([]);

  // Form state
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Modal Audit state
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null);

  useEffect(() => {
    const unsubscribeUser = DatabaseService.subscribeCurrentUser((user) => {
      setCurrentUser(user);
    });

    const unsubscribeFiles = DatabaseService.subscribeFiles((fls) => {
      setFiles(fls);
    });

    const unsubscribeModules = DatabaseService.subscribeModules((mods) => {
      setModules(mods);
    });

    return () => {
      unsubscribeUser();
      unsubscribeFiles();
      unsubscribeModules();
    };
  }, []);

  const handleSimulateSelect = (name: string) => {
    setFileName(name);
  };

  const handleUpload = async () => {
    if (!currentUser || currentUser.module === 'None') return;
    setFormError(null);
    setFormSuccess(null);

    if (!fileName.trim()) {
      setFormError('Please input a file name or select one below.');
      return;
    }
    if (!fileDescription.trim()) {
      setFormError('Please describe the changes or contents of this upload.');
      return;
    }

    try {
      // Simulate file URL
      const mockUrl = `https://storage.glassboard.com/assets/${fileName.trim().toLowerCase().replace(/ /g, '_')}`;
      
      await DatabaseService.uploadSharedFile(
        fileName.trim(),
        mockUrl,
        currentUser.module,
        fileDescription.trim()
      );

      setFileName('');
      setFileDescription('');
      setFormSuccess('File shared/updated in collaborative workspace successfully!');
      setTimeout(() => setFormSuccess(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'File upload failed.');
    }
  };

  const getModuleName = (id: string) => {
    return modules.find(m => m.id === id)?.name || id;
  };

  if (!currentUser) return null;
  const isHead = currentUser.role === 'head';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Inter-Module Shared Workspace</Text>
        <Text style={styles.subText}>
          Collab space for technical blueprints and spec sheets. System automatically enforces version history and full edit logs.
        </Text>
      </View>

      <View style={styles.layout}>
        {/* Left pane: File listing */}
        <View style={styles.leftPane}>
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Shared Assets Repository</Text>
            <Text style={styles.sectionSubtitle}>Click on any asset to view its complete audit trail and previous revisions.</Text>

            <View style={styles.fileList}>
              {files.length === 0 ? (
                <Text style={styles.emptyText}>No files uploaded yet.</Text>
              ) : (
                files.map((file) => (
                  <Pressable
                    key={file.id}
                    style={({ pressed }) => [
                      styles.fileItem,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedFile(file)}
                  >
                    <View style={styles.fileIconBox}>
                      <Text style={styles.fileIcon}>📄</Text>
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <Text style={styles.fileMeta}>
                        Ver {file.version} • Shared by {getModuleName(file.moduleId)}
                      </Text>
                      <Text style={styles.fileTime}>
                        Last modified: {new Date(file.uploadedAt).toLocaleString()} by {file.uploadedBy}
                      </Text>
                    </View>
                    <View style={styles.arrowBadge}>
                      <Text style={styles.arrowText}>View History ➔</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </GlassCard>
        </View>

        {/* Right pane: Upload Form (Only for module members) */}
        {!isHead && (
          <View style={styles.rightPane}>
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Upload / Revise Asset</Text>
              <Text style={styles.sectionSubtitle}>
                Uploading with an existing filename creates a new version with an audit trail, keeping prior files intact.
              </Text>

              {formError && <Text style={styles.errorText}>{formError}</Text>}
              {formSuccess && <Text style={styles.successText}>{formSuccess}</Text>}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Asset Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. system_architecture_spec.json"
                  placeholderTextColor="#64748B"
                  value={fileName}
                  onChangeText={setFileName}
                />
                <View style={styles.suggestRow}>
                  <Text style={styles.suggestLabel}>Quick select:</Text>
                  {['petstore_spec.json', 'system_database_schema.sql', 'design_layout_blueprint.dwg'].map(item => (
                    <Pressable key={item} style={styles.suggestBtn} onPress={() => handleSimulateSelect(item)}>
                      <Text style={styles.suggestBtnText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>What has been altered / Revision Notes:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Detail the changes, additions or fixes in this version..."
                  placeholderTextColor="#64748B"
                  value={fileDescription}
                  onChangeText={setFileDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Pressable style={styles.uploadBtn} onPress={handleUpload}>
                <Text style={styles.uploadBtnText}>Share / Publish Asset Version</Text>
              </Pressable>
            </GlassCard>
          </View>
        )}
      </View>

      {/* Version History Modal */}
      {selectedFile && (
        <Modal
          visible={selectedFile !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedFile(null)}
        >
          <View style={styles.modalBg}>
            <GlassCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedFile.name}</Text>
                  <Text style={styles.modalSubtitle}>Version & Revision Audit History Trail</Text>
                </View>
                <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedFile(null)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.historyList}>
                {selectedFile.history.map((hist) => (
                  <View key={hist.version} style={styles.historyItem}>
                    <View style={styles.historyMetaRow}>
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionBadgeText}>v{hist.version}</Text>
                      </View>
                      <Text style={styles.historyTime}>
                        {new Date(hist.updatedAt).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.historyUser}>Modified by: {hist.updatedBy}</Text>
                    <Text style={styles.historyDesc}>"{hist.description}"</Text>
                    <Text style={styles.historyLink}>Asset URL: {hist.url}</Text>
                  </View>
                ))}
              </ScrollView>
            </GlassCard>
          </View>
        </Modal>
      )}
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
  layout: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 24,
  },
  leftPane: {
    flex: 3,
  },
  rightPane: {
    flex: 2,
  },
  sectionCard: {
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
  fileList: {
    gap: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  fileIcon: {
    fontSize: 18,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  fileMeta: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 4,
  },
  fileTime: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  arrowBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  arrowText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  suggestLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  suggestBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  suggestBtnText: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  uploadBtn: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any
    })
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '700',
  },
  historyList: {
    gap: 16,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  versionBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  historyTime: {
    fontSize: 10,
    color: '#64748B',
  },
  historyUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  historyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  historyLink: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
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
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  pressed: {
    opacity: 0.8,
  },
});
