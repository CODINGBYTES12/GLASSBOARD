import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, useColorScheme, View, StyleSheet, Text } from 'react-native';
import { DatabaseService } from '@/services/db';
import { User } from '@/services/mockData';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = DatabaseService.subscribeCurrentUser((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Tabs>
      <TabSlot style={{ height: '100%', backgroundColor: '#090D16' }} />
      <TabList asChild>
        <CustomTabList currentUser={currentUser}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Dashboard</TabButton>
          </TabTrigger>
          <TabTrigger name="handshakes" href="/handshakes" asChild>
            <TabButton>Handshakes</TabButton>
          </TabTrigger>
          <TabTrigger name="files" href="/files" asChild>
            <TabButton>Files Workspace</TabButton>
          </TabTrigger>
          {currentUser?.role === 'head' && (
            <TabTrigger name="management" href="/management" asChild>
              <TabButton>Management View</TabButton>
            </TabTrigger>
          )}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.tabButtonView,
          isFocused ? styles.tabButtonViewSelected : styles.tabButtonViewUnselected,
        ]}>
        <Text style={[styles.tabButtonText, isFocused ? styles.tabTextSelected : styles.tabTextUnselected]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

interface CustomTabListProps extends TabListProps {
  currentUser: User | null;
}

export function CustomTabList({ currentUser, ...props }: CustomTabListProps) {
  const handleLogout = async () => {
    await DatabaseService.logout();
  };

  const getUserBadgeColor = () => {
    if (currentUser?.role === 'head') return '#8B5CF6';
    if (currentUser?.module === 'module_a') return '#10B981';
    if (currentUser?.module === 'module_b') return '#F59E0B';
    return '#EF4444';
  };

  const getModuleLabel = () => {
    if (currentUser?.role === 'head') return 'Head';
    if (currentUser?.module === 'module_a') return 'Mod A';
    if (currentUser?.module === 'module_b') return 'Mod B';
    if (currentUser?.module === 'module_c') return 'Mod C';
    return '';
  };

  return (
    <View style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <Text style={styles.brandText}>GLASSBOARD</Text>

        <View style={styles.tabsWrapper}>
          {props.children}
        </View>

        {currentUser && (
          <View style={styles.userSection}>
            <View style={[styles.userBadge, { borderColor: getUserBadgeColor(), backgroundColor: getUserBadgeColor() + '15' }]}>
              <Text style={[styles.userBadgeText, { color: getUserBadgeColor() }]}>
                {getModuleLabel()}
              </Text>
            </View>
            <Text style={styles.userNameText}>{currentUser.name}</Text>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 100,
  },
  innerContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    backdropFilter: 'blur(20px)',
  } as any,
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.5,
    marginRight: Spacing.four,
  },
  tabsWrapper: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.75,
  },
  tabButtonView: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two + 2,
  },
  tabButtonViewSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tabButtonViewUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#8B5CF6',
  },
  tabTextUnselected: {
    color: '#94A3B8',
  },
  userSection: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  userBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  userBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  userNameText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    cursor: 'pointer',
  } as any,
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
});
