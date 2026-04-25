import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../providers/AuthProvider";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      setSubmitting(true);
      const errorMessage = await signIn(email.trim(), password);

      if (errorMessage) {
        Alert.alert("Sign in failed", errorMessage);
        return;
      }

      router.replace("/stamp");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to save your stamps in the cloud.</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={COLORS.placeholder}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={COLORS.placeholder}
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryBtn} onPress={onSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={COLORS.primaryText} />
        ) : (
          <Text style={styles.primaryBtnText}>Sign In</Text>
        )}
      </Pressable>

      <Link href="/sign-up" asChild>
        <Pressable>
          <Text style={styles.linkText}>Create an account</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  input: {
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 14,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: COLORS.primaryText,
    fontSize: 17,
    fontWeight: "600",
  },
  linkText: {
    marginTop: 18,
    textAlign: "center",
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});