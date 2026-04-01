import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (route) => pathname === route;

  const NavLink = ({ label, path, isActive }) => (
    <TouchableOpacity 
      onPress={() => { setMenuOpen(false); router.push(path); }} 
    >
      <Text style={[styles.navLink, isActive && styles.activeNav]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.headerContainer}>
      <Pressable onPress={() => router.push("/")}>
        <Text style={styles.logoText}>ZeniaBiz</Text>
      </Pressable>
    <TouchableOpacity 
      onPress={() => setMenuOpen(!menuOpen)} 
      style={styles.menuButton}
    >
      <Text style={styles.menuText}>{menuOpen ? "✖" : "☰"}</Text>
    </TouchableOpacity>

    {menuOpen && (
      <View style={styles.overlay}>
        <View style={styles.navSmall}>

          <NavLink 
            label="Settings" 
            path="/settings" 
            isActive={isActive("/(tabs)/settings")} 
          />

          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", width: "80%", marginVertical: 10 }} />

            <NavLink 
              label="❤️ Support this app"
              path="/support" 
              isActive={isActive("/(tabs)/support")} 
            />
          </View>
        
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#2E8B8B",
    height: 90,
    paddingTop:"20",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999, 
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    color: "#FAF9F7",
    fontSize: 22,
    fontWeight: "700",
  },
  navLink: {
    color: "#FAF9F7",
    fontSize: 16,
  },
  activeNav: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B6B",
    paddingBottom: 2,
  },
  menuButton: {
    padding: 8,
  },
  menuText: {
    color: "#FAF9F7",
    fontSize: 24,
    fontWeight: "bold",
  },
  overlay: {
    position: "absolute",
    top: 90,
    bottom:0,
    left: 0,
    right: 0,
    height:"100%",
    zIndex: 998,
  },
  navSmall: {
    backgroundColor: "#2E8B8B",
    paddingVertical: 20,
    alignItems: "center",
    gap: 16,
    zIndex: 999,
    elevation: 10,
  },
});
