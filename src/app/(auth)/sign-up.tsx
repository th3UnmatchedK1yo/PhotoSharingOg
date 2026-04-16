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
import { useAuth } from "../../providers/AuthProvider";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await signUp(email.trim(), password);

      if (result.errorMessage) {
        Alert.alert("Sign up failed", result.errorMessage);
        return;
      }

      if (result.needsEmailConfirm) {
        Alert.alert(
          "Check your email",
          "Your account was created. Please verify your email, then sign in."
        );
        router.replace("/sign-in");
        return;
      }

      router.replace("/stamp");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Start saving private stamps to your account.</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#9b948e"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        secureTextEntry
        placeholder="Password"
        placeholderTextColor="#9b948e"
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryBtn} onPress={onSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Sign Up</Text>
        )}
      </Pressable>

      <Link href="/sign-in" asChild>
        <Pressable>
          <Text style={styles.linkText}>Already have an account?</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
    color: "#4f4a47",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: "#7b746f",
    marginBottom: 24,
  },
  input: {
    height: 56,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ddd4ce",
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#333",
    marginBottom: 14,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#5f5a56",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  linkText: {
    marginTop: 18,
    textAlign: "center",
    color: "#5f5a56",
    fontSize: 16,
    fontWeight: "600",
  },
});