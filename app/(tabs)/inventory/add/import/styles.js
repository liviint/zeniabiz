export const getStyles = (C) => ({
  
  hero: {
    backgroundColor: C.beige,
    borderRadius: 22,
    padding: 22,
    gap: 12,
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    color: C.text,
    fontSize: 21,
    fontWeight: "800",
  },
  heroText: {
    color: C.text,
    fontSize: 14,
    lineHeight: 22,
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    color: C.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontWeight: "800",
    marginBottom:4
  },
  body: {
    marginBottom:8,
    fontSize:13,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: C.teal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 14,
  },
  buttonIcon: {
    color: C.white,
    fontSize: 20,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButton: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.teal,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  secondaryButtonText: {
    color: C.teal,
    fontWeight: "800",
  },
  
  noteTitle: {
    fontWeight: "800",
  },
  noteText: {
    fontSize: 12,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row",
    gap: 9,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 12,
    gap: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    color: C.muted,
  },
  warning: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFF0E9",
    gap: 6,
  },
  warningTitle: {
    color: C.red,
    fontWeight: "800",
  },
  warningText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 19,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  productNumber: {
    backgroundColor: C.beige,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  productNumberText: {
    fontSize: 11,
    color: C.text,
    fontWeight: "800",
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
  },
  productMeta: {
    fontSize: 12,
    color: C.muted,
  },
  errorText: {
    color: C.red,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 5,
  },
  successHero: {
    backgroundColor: "#E7F3ED",
    padding: 22,
    borderRadius: 20,
    alignItems: "flex-start",
    gap: 10,
  },
  successIcon: {
    width: 42,
    height: 42,
    overflow: "hidden",
    borderRadius: 21,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: C.green,
    color: C.white,
    fontSize: 24,
    fontWeight: "800",
  },
  loading: {
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: C.teal,
    fontSize: 13,
    fontWeight: "700",
  },
})