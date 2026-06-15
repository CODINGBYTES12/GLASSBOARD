import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { DatabaseService } from '@/services/db';
import { SEED_USERS } from '@/services/mockData';
import GlassCard from '@/components/GlassCard';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (selectedEmail: string) => {
    try {
      setError(null);
      await DatabaseService.login(selectedEmail, 'password123');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleManualSubmit = () => {
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    handleLogin(email);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.logoText}>GLASSBOARD</Text>
          <Text style={styles.subtitleText}>VERIFIABLE DEPENDENCY TRACKER</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Sign In</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter organizational email..."
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable style={styles.button} onPress={handleManualSubmit}>
            <Text style={styles.buttonText}>Authenticate</Text>
          </Pressable>
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR QUICK ACCESS PROFILES</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.profilesContainer}>
          {SEED_USERS.map((user) => {
            const getModuleLabel = () => {
              if (user.role === 'head') return 'Organization Head';
              if (user.module === 'module_a') return 'Frontend Core';
              if (user.module === 'module_b') return 'API Gateway & Auth';
              if (user.module === 'module_c') return 'Analytics Engine';
              return 'None';
            };

            const getModuleColor = () => {
              if (user.role === 'head') return '#8B5CF6'; // Violet
              if (user.module === 'module_a') return '#10B981'; // Green
              if (user.module === 'module_b') return '#F59E0B'; // Orange
              if (user.module === 'module_c') return '#EF4444'; // Red
              return '#64748B';
            };

            return (
              <Pressable
                key={user.uid}
                style={({ pressed }) => [
                  styles.profileButton,
                  pressed && styles.profileButtonPressed,
                  { borderLeftColor: getModuleColor() }
                ]}
                onPress={() => handleLogin(user.email)}
              >
                <View>
                  <Text style={styles.profileName}>{user.name}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                </View>
                <View style={[styles.moduleBadge, { backgroundColor: getModuleColor() + '20', borderColor: getModuleColor() }]}>
                  <Text style={[styles.moduleBadgeText, { color: getModuleColor() }]}>
                    {getModuleLabel()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#090D16', // Deep space-black
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 32,
    borderWidth: 1.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
    ...Platform.select({
      web: {
        textShadow: '0 0 12px rgba(139, 92, 246, 0.4)',
      } as any
    })
  },
  subtitleText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any
    })
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  profilesContainer: {
    gap: 12,
  },
  profileButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any
    })
  },
  profileButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  profileName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  moduleBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
