import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/queries/useSettings";
import { useUpdateSettings } from "@/hooks/mutations/useUpdateSettings";
import { useUsernameCheck } from "@/hooks/queries/useUsernameCheck";
import { api } from "@/lib/api";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user, signOut } = useAuth();

  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [readingGoal, setReadingGoal] = useState("");
  const [profileEnabled, setProfileEnabled] = useState(false);
  const [showCurrentlyReading, setShowCurrentlyReading] = useState(false);
  const [showTbr, setShowTbr] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: usernameCheck, isFetching: isCheckingUsername } = useUsernameCheck(username);

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setName(settings.name ?? "");
      setUsername(settings.username ?? "");
      setBio(settings.bio ?? "");
      setReadingGoal(settings.readingGoal ? String(settings.readingGoal) : "");
      setProfileEnabled(settings.profileEnabled);
      setShowCurrentlyReading(settings.showCurrentlyReading);
      setShowTbr(settings.showTbr);
    }
  }, [settings]);

  const markChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    const goalNum = readingGoal ? parseInt(readingGoal, 10) : null;
    const validGoal = goalNum !== null && !isNaN(goalNum) && goalNum >= 1 && goalNum <= 500
      ? goalNum
      : null;

    updateSettings.mutate(
      {
        name: name || null,
        username: username || null,
        bio: bio || null,
        readingGoal: validGoal,
        profileEnabled,
        showCurrentlyReading,
        showTbr,
      },
      {
        onSuccess: () => {
          setHasChanges(false);
          Alert.alert("Saved", "Your settings have been updated.");
        },
      },
    );
  }, [name, username, bio, readingGoal, profileEnabled, showCurrentlyReading, showTbr, updateSettings]);

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          onPress: async () => {
            await signOut();
            router.replace("/sign-in");
          },
        },
      ],
    );
  }, [signOut, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This action cannot be undone.\n\nType DELETE to confirm.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/api/user");
              await signOut();
              router.replace("/sign-in");
            } catch {
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          },
        },
      ],
    );
  }, [signOut, router]);

  const avatarUrl = settings?.profilePictureUrl ?? settings?.image ?? user?.image;

  if (isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={isDark ? "#60a5fa" : "#3b82f6"} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
      <ScrollView
        testID="settings-scroll"
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          {avatarUrl ? (
            <Image
              testID="settings-avatar"
              source={{ uri: avatarUrl }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : (
            <View
              testID="settings-avatar-placeholder"
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isDark ? "#334155" : "#e2e8f0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 28, color: isDark ? "#64748b" : "#94a3b8" }}>@</Text>
            </View>
          )}
        </View>

        {/* Profile Section */}
        <Text
          style={{
            fontSize: 17,
            fontWeight: "bold",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 12,
          }}
        >
          Profile
        </Text>

        {/* Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
            Name
          </Text>
          <TextInput
            testID="settings-name-input"
            value={name}
            onChangeText={(text) => { setName(text); markChanged(); }}
            placeholder="Your name"
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            style={{
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: isDark ? "#f8fafc" : "#1a1a1a",
            }}
          />
        </View>

        {/* Username */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
            Username
          </Text>
          <TextInput
            testID="settings-username-input"
            value={username}
            onChangeText={(text) => { setUsername(text.toLowerCase().replace(/[^a-z0-9_-]/g, "")); markChanged(); }}
            placeholder="username"
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            autoCapitalize="none"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: isDark ? "#f8fafc" : "#1a1a1a",
            }}
          />
          {username.length >= 3 && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              {isCheckingUsername ? (
                <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>Checking...</Text>
              ) : usernameCheck?.available ? (
                <Text testID="username-available" style={{ fontSize: 12, color: "#22c55e" }}>Username is available</Text>
              ) : (
                <Text testID="username-taken" style={{ fontSize: 12, color: "#ef4444" }}>Username is taken</Text>
              )}
            </View>
          )}
        </View>

        {/* Bio */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
            Bio
          </Text>
          <TextInput
            testID="settings-bio-input"
            value={bio}
            onChangeText={(text) => {
              if (text.length <= 500) {
                setBio(text);
                markChanged();
              }
            }}
            placeholder="Tell others about yourself"
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: isDark ? "#f8fafc" : "#1a1a1a",
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
          <Text
            testID="bio-char-count"
            style={{
              fontSize: 11,
              color: bio.length > 450 ? "#ef4444" : (isDark ? "#64748b" : "#94a3b8"),
              textAlign: "right",
              marginTop: 4,
            }}
          >
            {bio.length}/500
          </Text>
        </View>

        {/* Reading Goal */}
        <Text
          style={{
            fontSize: 17,
            fontWeight: "bold",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          Reading Goal
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
            Books per year (1-500)
          </Text>
          <TextInput
            testID="settings-reading-goal-input"
            value={readingGoal}
            onChangeText={(text) => {
              const val = parseInt(text, 10);
              if (!isNaN(val) && val >= 0 && val <= 500) {
                setReadingGoal(String(val));
                markChanged();
              } else if (text === "") {
                setReadingGoal("");
                markChanged();
              }
            }}
            keyboardType="numeric"
            placeholder="24"
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            style={{
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: isDark ? "#f8fafc" : "#1a1a1a",
            }}
          />
        </View>

        {/* Privacy Toggles */}
        <Text
          style={{
            fontSize: 17,
            fontWeight: "bold",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          Privacy
        </Text>

        <View
          style={{
            backgroundColor: isDark ? "#1e293b" : "#f8fafc",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
              Profile Enabled
            </Text>
            <Switch
              testID="settings-profile-enabled"
              value={profileEnabled}
              onValueChange={(val) => { setProfileEnabled(val); markChanged(); }}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
              Show Currently Reading
            </Text>
            <Switch
              testID="settings-show-currently-reading"
              value={showCurrentlyReading}
              onValueChange={(val) => { setShowCurrentlyReading(val); markChanged(); }}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
              Show TBR
            </Text>
            <Switch
              testID="settings-show-tbr"
              value={showTbr}
              onValueChange={(val) => { setShowTbr(val); markChanged(); }}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
            />
          </View>
        </View>

        {/* Save Button */}
        {hasChanges && (
          <Pressable
            testID="settings-save-button"
            onPress={handleSave}
            disabled={updateSettings.isPending}
            style={({ pressed }) => ({
              paddingVertical: 14,
              borderRadius: 10,
              backgroundColor: pressed ? "#2563eb" : "#3b82f6",
              alignItems: "center",
              marginBottom: 24,
              opacity: updateSettings.isPending ? 0.6 : 1,
            })}
          >
            {updateSettings.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
                Save Changes
              </Text>
            )}
          </Pressable>
        )}

        {/* Account Section */}
        <Text
          style={{
            fontSize: 17,
            fontWeight: "bold",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          Account
        </Text>

        <View
          style={{
            backgroundColor: isDark ? "#1e293b" : "#f8fafc",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4 }}>
            Email
          </Text>
          <Text
            testID="settings-email"
            style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155", marginBottom: 16 }}
          >
            {settings?.email ?? user?.email ?? ""}
          </Text>

          <Pressable
            testID="settings-sign-out"
            onPress={handleSignOut}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: isDark ? "#334155" : "#f1f5f9",
              alignItems: "center",
              marginBottom: 12,
              borderWidth: 1,
              borderColor: isDark ? "#475569" : "#e2e8f0",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#e2e8f0" : "#475569" }}>
              Sign Out
            </Text>
          </Pressable>

          <Pressable
            testID="settings-delete-account"
            onPress={handleDeleteAccount}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: isDark ? "#450a0a" : "#fef2f2",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "#7f1d1d" : "#fca5a5",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#fca5a5" : "#991b1b" }}>
              Delete Account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
