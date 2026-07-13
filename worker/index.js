var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { createClient } from "@supabase/supabase-js";
var allowedAdminRoles = new Set(["super_admin", "admin", "manager", "customer_care"]);
var approvalRequestOptions = [
    "IC / Passport / Driving License",
    "Proof of Address",
    "Professional Certificates",
    "Background Check",
];
function corsHeaders(origin) {
    var allowedOrigin = origin && /^https:\/\/admin\.dellaapp\.com$/i.test(origin)
        ? origin
        : "https://admin.dellaapp.com";
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
}
function json(data, init, origin) {
    var _a;
    return Response.json(data, __assign(__assign({}, init), { headers: __assign(__assign({}, corsHeaders(origin)), ((_a = init === null || init === void 0 ? void 0 : init.headers) !== null && _a !== void 0 ? _a : {})) }));
}
function buildAdminSupabaseClient(env) {
    var _a, _b, _c, _d;
    var url = ((_a = env.SUPABASE_URL) === null || _a === void 0 ? void 0 : _a.trim()) || ((_b = env.VITE_SUPABASE_URL) === null || _b === void 0 ? void 0 : _b.trim()) || "";
    var serviceKey = (_d = (_c = env.SUPABASE_SERVICE_ROLE_KEY) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
    if (!url || !serviceKey) {
        return null;
    }
    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
function splitPhoneNumber(value) {
    var _a, _b;
    var trimmed = value.trim();
    if (!trimmed) {
        return {
            countryCode: null,
            phoneNumber: null,
        };
    }
    if (!trimmed.startsWith("+")) {
        return {
            countryCode: null,
            phoneNumber: trimmed,
        };
    }
    var match = trimmed.match(/^(\+\d+)\s*(.*)$/);
    return {
        countryCode: (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : null,
        phoneNumber: ((_b = match === null || match === void 0 ? void 0 : match[2]) === null || _b === void 0 ? void 0 : _b.trim()) || null,
    };
}
function splitFullName(fullName) {
    var _a = fullName.trim().split(/\s+/).filter(Boolean), _b = _a[0], firstName = _b === void 0 ? "" : _b, rest = _a.slice(1);
    return {
        firstName: firstName,
        lastName: rest.join(" "),
    };
}
function verifyAdminRequest(request, env) {
    return __awaiter(this, void 0, void 0, function () {
        var adminClient, origin, authorization, token, _a, user, userError, _b, profile, profileError, adminProfile;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    adminClient = buildAdminSupabaseClient(env);
                    origin = request.headers.get("origin");
                    if (!adminClient) {
                        return [2 /*return*/, {
                                error: json({ error: "Worker env is missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 }, origin),
                            }];
                    }
                    authorization = request.headers.get("authorization");
                    token = (authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer ")) ? authorization.slice("Bearer ".length) : null;
                    if (!token) {
                        return [2 /*return*/, {
                                error: json({ error: "Missing auth token." }, { status: 401 }, origin),
                            }];
                    }
                    return [4 /*yield*/, adminClient.auth.getUser(token)];
                case 1:
                    _a = _d.sent(), user = _a.data.user, userError = _a.error;
                    if (userError || !user) {
                        return [2 /*return*/, {
                                error: json({ error: "Invalid admin session." }, { status: 401 }, origin),
                            }];
                    }
                    return [4 /*yield*/, adminClient
                            .from("profiles")
                            .select("id, role")
                            .eq("id", user.id)
                            .maybeSingle()];
                case 2:
                    _b = _d.sent(), profile = _b.data, profileError = _b.error;
                    adminProfile = profile;
                    if (profileError || !adminProfile || !allowedAdminRoles.has(((_c = adminProfile.role) !== null && _c !== void 0 ? _c : "").trim().toLowerCase())) {
                        return [2 /*return*/, {
                                error: json({ error: "This account is not allowed to manage providers." }, { status: 403 }, origin),
                            }];
                    }
                    return [2 /*return*/, { adminClient: adminClient }];
            }
        });
    });
}
function sendApprovalEmail(env, provider, profile) {
    return __awaiter(this, void 0, void 0, function () {
        var resendApiKey, fromEmail, providerName, response, payload;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    resendApiKey = (_b = (_a = env.RESEND_API_KEY) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
                    fromEmail = ((_c = env.RESEND_FROM_EMAIL) === null || _c === void 0 ? void 0 : _c.trim()) || "DELLA <noreply@dellaapp.com>";
                    if (!resendApiKey) {
                        return [2 /*return*/, { warning: "Provider approved, but RESEND_API_KEY is missing so the email was not sent." }];
                    }
                    if (!((_d = provider === null || provider === void 0 ? void 0 : provider.email) === null || _d === void 0 ? void 0 : _d.trim())) {
                        return [2 /*return*/, { warning: "Provider approved, but no provider email was found." }];
                    }
                    providerName = ((_e = profile === null || profile === void 0 ? void 0 : profile.marketing_name) === null || _e === void 0 ? void 0 : _e.trim()) ||
                        ((_f = provider.full_name) === null || _f === void 0 ? void 0 : _f.trim()) ||
                        provider.email.split("@")[0] ||
                        "Provider";
                    return [4 /*yield*/, fetch("https://api.resend.com/emails", {
                            method: "POST",
                            headers: {
                                Authorization: "Bearer ".concat(resendApiKey),
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                from: fromEmail,
                                to: [provider.email.trim()],
                                subject: "Your DELLA provider listing is approved",
                                html: "\n        <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#0f172a\">\n          <h2 style=\"margin-bottom:12px;color:#16a34a\">Your provider listing is now approved</h2>\n          <p>Hi ".concat(providerName, ",</p>\n          <p>Your DELLA service provider profile has been approved and is now visible to customers.</p>\n          <p>You can now receive bookings. Keep the app on and stay available for more job requests.</p>\n          <p>Customers can now find your profile and start booking your services.</p>\n          <p>Thanks,<br />DELLA Team</p>\n        </div>\n      "),
                            }),
                        })];
                case 1:
                    response = _g.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    payload = (_g.sent());
                    return [2 /*return*/, {
                            warning: payload.message || payload.error || "Provider approved, but the approval email was not sent.",
                        }];
                case 3: return [2 /*return*/, { warning: null }];
            }
        });
    });
}
function handleProviderVerification(request, env) {
    return __awaiter(this, void 0, void 0, function () {
        var origin, verified, payload, providerId, adminClient, timestamp, cleanedDocuments, verificationError_1, active, profileError_1, verificationError, profileError, accountError, _a, providerAccount, providerProfile, emailResult;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    origin = request.headers.get("origin");
                    if (request.method === "OPTIONS") {
                        return [2 /*return*/, new Response(null, {
                                status: 204,
                                headers: corsHeaders(origin),
                            })];
                    }
                    if (request.method !== "POST") {
                        return [2 /*return*/, json({ error: "Method not allowed." }, { status: 405 }, origin)];
                    }
                    return [4 /*yield*/, verifyAdminRequest(request, env)];
                case 1:
                    verified = _l.sent();
                    if ("error" in verified) {
                        return [2 /*return*/, verified.error];
                    }
                    return [4 /*yield*/, request.json().catch(function () { return ({}); })];
                case 2:
                    payload = (_l.sent());
                    providerId = (_c = (_b = payload.providerId) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "";
                    if (!providerId) {
                        return [2 /*return*/, json({ error: "providerId is required." }, { status: 400 }, origin)];
                    }
                    adminClient = verified.adminClient;
                    timestamp = new Date().toISOString();
                    if (!(payload.action === "request_documents")) return [3 /*break*/, 6];
                    cleanedDocuments = ((_d = payload.requestedDocuments) !== null && _d !== void 0 ? _d : [])
                        .map(function (value) { return value.trim(); })
                        .filter(function (value) { return approvalRequestOptions.includes(value); });
                    return [4 /*yield*/, adminClient
                            .from("provider_verifications")
                            .upsert({
                            provider_id: providerId,
                            requested_documents: cleanedDocuments,
                            admin_note: (_f = (_e = payload.note) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : "",
                            last_reviewed_at: timestamp,
                        }, { onConflict: "provider_id" })];
                case 3:
                    verificationError_1 = (_l.sent()).error;
                    if (verificationError_1) {
                        return [2 /*return*/, json({ error: verificationError_1.message || "Unable to request provider documents." }, { status: 500 }, origin)];
                    }
                    return [4 /*yield*/, adminClient
                            .from("provider_profiles")
                            .update({ approval_status: "document_review", is_visible: false })
                            .eq("id", providerId)];
                case 4:
                    _l.sent();
                    return [4 /*yield*/, adminClient.from("profiles").update({ status: "pending" }).eq("id", providerId)];
                case 5:
                    _l.sent();
                    return [2 /*return*/, json({ success: true }, undefined, origin)];
                case 6:
                    if (!(payload.action === "set_visibility")) return [3 /*break*/, 9];
                    active = Boolean(payload.active);
                    return [4 /*yield*/, adminClient
                            .from("provider_profiles")
                            .update({ is_visible: active })
                            .eq("id", providerId)];
                case 7:
                    profileError_1 = (_l.sent()).error;
                    if (profileError_1) {
                        return [2 /*return*/, json({ error: profileError_1.message || "Unable to update provider visibility." }, { status: 500 }, origin)];
                    }
                    return [4 /*yield*/, adminClient.from("profiles").update({ status: active ? "active" : "paused" }).eq("id", providerId)];
                case 8:
                    _l.sent();
                    return [2 /*return*/, json({ success: true }, undefined, origin)];
                case 9: return [4 /*yield*/, adminClient
                        .from("provider_verifications")
                        .upsert({
                        provider_id: providerId,
                        identity_verified: true,
                        kyc_verified: true,
                        background_check_verified: true,
                        requested_documents: [],
                        admin_note: (_h = (_g = payload.note) === null || _g === void 0 ? void 0 : _g.trim()) !== null && _h !== void 0 ? _h : "",
                        last_reviewed_at: timestamp,
                    }, { onConflict: "provider_id" })];
                case 10:
                    verificationError = (_l.sent()).error;
                    if (verificationError) {
                        return [2 /*return*/, json({ error: verificationError.message || "Unable to approve provider verification." }, { status: 500 }, origin)];
                    }
                    return [4 /*yield*/, adminClient
                            .from("provider_profiles")
                            .update({
                            approval_status: "approved",
                            is_visible: true,
                        })
                            .eq("id", providerId)];
                case 11:
                    profileError = (_l.sent()).error;
                    if (profileError) {
                        return [2 /*return*/, json({ error: profileError.message || "Unable to update provider approval." }, { status: 500 }, origin)];
                    }
                    return [4 /*yield*/, adminClient
                            .from("profiles")
                            .update({ status: "active" })
                            .eq("id", providerId)];
                case 12:
                    accountError = (_l.sent()).error;
                    if (accountError) {
                        return [2 /*return*/, json({ error: accountError.message || "Unable to activate provider account." }, { status: 500 }, origin)];
                    }
                    return [4 /*yield*/, Promise.all([
                            adminClient.from("profiles").select("id, full_name, email").eq("id", providerId).maybeSingle(),
                            adminClient.from("provider_profiles").select("marketing_name").eq("id", providerId).maybeSingle(),
                        ])];
                case 13:
                    _a = _l.sent(), providerAccount = _a[0].data, providerProfile = _a[1].data;
                    return [4 /*yield*/, sendApprovalEmail(env, (_j = providerAccount) !== null && _j !== void 0 ? _j : null, (_k = providerProfile) !== null && _k !== void 0 ? _k : null)];
                case 14:
                    emailResult = _l.sent();
                    return [2 /*return*/, json({ success: true, warning: emailResult.warning }, undefined, origin)];
            }
        });
    });
}
function handlePaymentSettlement(request, env) {
    return __awaiter(this, void 0, void 0, function () {
        var origin, verified, payload, paymentId, adminClient, _a, payment, paymentError, paymentRow, hasSettlementProof, nextStatus, alreadyInTargetStatus, approvedAt, _b, updatedPayment, updateError;
        var _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    origin = request.headers.get("origin");
                    if (request.method === "OPTIONS") {
                        return [2 /*return*/, new Response(null, {
                                status: 204,
                                headers: corsHeaders(origin),
                            })];
                    }
                    if (request.method !== "POST") {
                        return [2 /*return*/, json({ error: "Method not allowed." }, { status: 405 }, origin)];
                    }
                    return [4 /*yield*/, verifyAdminRequest(request, env)];
                case 1:
                    verified = _j.sent();
                    if ("error" in verified) {
                        return [2 /*return*/, verified.error];
                    }
                    return [4 /*yield*/, request.json().catch(function () { return ({}); })];
                case 2:
                    payload = (_j.sent());
                    paymentId = (_d = (_c = payload.paymentId) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
                    if ((payload.action !== "mark_paid" && payload.action !== "mark_rejected") || !paymentId) {
                        return [2 /*return*/, json({ error: "A valid paymentId is required." }, { status: 400 }, origin)];
                    }
                    adminClient = verified.adminClient;
                    return [4 /*yield*/, adminClient
                            .from("payments")
                            .select("id, company_payment_status, company_paid_at, provider_company_payment_proof_data_url, customer_payment_proof_data_url")
                            .eq("id", paymentId)
                            .maybeSingle()];
                case 3:
                    _a = _j.sent(), payment = _a.data, paymentError = _a.error;
                    paymentRow = (_e = payment) !== null && _e !== void 0 ? _e : null;
                    if (paymentError || !paymentRow) {
                        return [2 /*return*/, json({ error: "Payment record was not found." }, { status: 404 }, origin)];
                    }
                    hasSettlementProof = Boolean((_f = paymentRow.provider_company_payment_proof_data_url) === null || _f === void 0 ? void 0 : _f.trim()) ||
                        Boolean((_g = paymentRow.customer_payment_proof_data_url) === null || _g === void 0 ? void 0 : _g.trim());
                    if (payload.action === "mark_paid" && !hasSettlementProof) {
                        return [2 /*return*/, json({ error: "Provider payment slip is missing for this payment." }, { status: 400 }, origin)];
                    }
                    nextStatus = payload.action === "mark_paid" ? "paid" : "rejected";
                    alreadyInTargetStatus = ((_h = paymentRow.company_payment_status) !== null && _h !== void 0 ? _h : "").trim().toLowerCase() === nextStatus;
                    if (alreadyInTargetStatus) {
                        return [2 /*return*/, json({
                                success: true,
                                payment: {
                                    id: paymentRow.id,
                                    company_payment_status: paymentRow.company_payment_status,
                                    company_paid_at: paymentRow.company_paid_at,
                                },
                            }, undefined, origin)];
                    }
                    approvedAt = payload.action === "mark_paid" ? new Date().toISOString() : null;
                    return [4 /*yield*/, adminClient
                            .from("payments")
                            .update({
                            company_payment_status: nextStatus,
                            company_paid_at: approvedAt,
                        })
                            .eq("id", paymentId)
                            .select("id, company_payment_status, company_paid_at")
                            .maybeSingle()];
                case 4:
                    _b = _j.sent(), updatedPayment = _b.data, updateError = _b.error;
                    if (updateError || !updatedPayment) {
                        return [2 /*return*/, json({ error: (updateError === null || updateError === void 0 ? void 0 : updateError.message) || "Unable to approve provider commission payment." }, { status: 500 }, origin)];
                    }
                    return [2 /*return*/, json({
                            success: true,
                            payment: updatedPayment,
                        }, undefined, origin)];
            }
        });
    });
}
function handleAccountCreate(request, env) {
    return __awaiter(this, void 0, void 0, function () {
        var origin, verified, payload, accountType, fullName, email, password, phone, adminClient, _a, createdUser, authError, userId, normalizedStatus, normalizedCountry, _b, countryCode, phoneNumber, _c, firstName, lastName, profileError, customerError, providerVisible, approvalStatus, providerProfileError, serviceError, verificationError, metadataError;
        var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
        return __generator(this, function (_9) {
            switch (_9.label) {
                case 0:
                    origin = request.headers.get("origin");
                    if (request.method === "OPTIONS") {
                        return [2 /*return*/, new Response(null, {
                                status: 204,
                                headers: corsHeaders(origin),
                            })];
                    }
                    if (request.method !== "POST") {
                        return [2 /*return*/, json({ error: "Method not allowed." }, { status: 405 }, origin)];
                    }
                    return [4 /*yield*/, verifyAdminRequest(request, env)];
                case 1:
                    verified = _9.sent();
                    if ("error" in verified) {
                        return [2 /*return*/, verified.error];
                    }
                    return [4 /*yield*/, request.json().catch(function () { return ({}); })];
                case 2:
                    payload = (_9.sent());
                    accountType = payload.accountType === "provider" ? "provider" : payload.accountType === "customer" ? "customer" : "";
                    fullName = (_e = (_d = payload.fullName) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : "";
                    email = (_g = (_f = payload.email) === null || _f === void 0 ? void 0 : _f.trim().toLowerCase()) !== null && _g !== void 0 ? _g : "";
                    password = (_j = (_h = payload.password) === null || _h === void 0 ? void 0 : _h.trim()) !== null && _j !== void 0 ? _j : "";
                    phone = (_l = (_k = payload.phone) === null || _k === void 0 ? void 0 : _k.trim()) !== null && _l !== void 0 ? _l : "";
                    if (!accountType || !fullName || !email || !password) {
                        return [2 /*return*/, json({ error: "accountType, fullName, email, and password are required." }, { status: 400 }, origin)];
                    }
                    adminClient = verified.adminClient;
                    return [4 /*yield*/, adminClient.auth.admin.createUser({
                            email: email,
                            password: password,
                            email_confirm: true,
                            user_metadata: {
                                full_name: fullName,
                                role: accountType === "provider" ? "service_provider" : "customer",
                            },
                        })];
                case 3:
                    _a = _9.sent(), createdUser = _a.data, authError = _a.error;
                    if (authError || !createdUser.user) {
                        return [2 /*return*/, json({ error: (authError === null || authError === void 0 ? void 0 : authError.message) || "Unable to create auth account." }, { status: 400 }, origin)];
                    }
                    userId = createdUser.user.id;
                    normalizedStatus = ((_m = payload.status) === null || _m === void 0 ? void 0 : _m.trim()) || (accountType === "provider" ? "pending" : "active");
                    normalizedCountry = ((_o = payload.country) === null || _o === void 0 ? void 0 : _o.trim()) || "Malaysia";
                    _b = splitPhoneNumber(phone), countryCode = _b.countryCode, phoneNumber = _b.phoneNumber;
                    _c = splitFullName(fullName), firstName = _c.firstName, lastName = _c.lastName;
                    return [4 /*yield*/, adminClient.from("profiles").upsert({
                            id: userId,
                            full_name: fullName,
                            email: email,
                            phone: phone || null,
                            role: accountType === "provider" ? "service_provider" : "customer",
                            status: normalizedStatus,
                        })];
                case 4:
                    profileError = (_9.sent()).error;
                    if (!profileError) return [3 /*break*/, 6];
                    return [4 /*yield*/, adminClient.auth.admin.deleteUser(userId)];
                case 5:
                    _9.sent();
                    return [2 /*return*/, json({ error: profileError.message || "Unable to create profile record." }, { status: 500 }, origin)];
                case 6:
                    if (!(accountType === "customer")) return [3 /*break*/, 10];
                    return [4 /*yield*/, adminClient.from("customer_profiles").upsert({
                            id: userId,
                            first_name: firstName || null,
                            last_name: lastName || null,
                            date_of_birth: ((_p = payload.dob) === null || _p === void 0 ? void 0 : _p.trim()) || null,
                            phone_number: phoneNumber,
                            country_code: countryCode,
                            city: ((_q = payload.city) === null || _q === void 0 ? void 0 : _q.trim()) || null,
                            region: ((_r = payload.region) === null || _r === void 0 ? void 0 : _r.trim()) || null,
                            country: normalizedCountry,
                            verified: normalizedStatus.toLowerCase() === "active",
                        })];
                case 7:
                    customerError = (_9.sent()).error;
                    if (!customerError) return [3 /*break*/, 9];
                    return [4 /*yield*/, adminClient.auth.admin.deleteUser(userId)];
                case 8:
                    _9.sent();
                    return [2 /*return*/, json({ error: customerError.message || "Unable to create customer profile." }, { status: 500 }, origin)];
                case 9: return [3 /*break*/, 22];
                case 10:
                    providerVisible = Boolean(payload.visible);
                    approvalStatus = ((_s = payload.approvalStatus) === null || _s === void 0 ? void 0 : _s.trim()) || "pending";
                    return [4 /*yield*/, adminClient.from("provider_profiles").upsert({
                            id: userId,
                            marketing_name: ((_t = payload.marketingName) === null || _t === void 0 ? void 0 : _t.trim()) || fullName,
                            profile_photo_url: ((_u = payload.profilePhotoUrl) === null || _u === void 0 ? void 0 : _u.trim()) || null,
                            service_location: ((_v = payload.serviceLocation) === null || _v === void 0 ? void 0 : _v.trim()) || ((_w = payload.city) === null || _w === void 0 ? void 0 : _w.trim()) || null,
                            service_radius_km: typeof payload.serviceRadiusKm === "number" && Number.isFinite(payload.serviceRadiusKm)
                                ? payload.serviceRadiusKm
                                : null,
                            date_of_birth: ((_x = payload.dob) === null || _x === void 0 ? void 0 : _x.trim()) || null,
                            sex: ((_y = payload.gender) === null || _y === void 0 ? void 0 : _y.trim()) || null,
                            residential_address: ((_z = payload.address) === null || _z === void 0 ? void 0 : _z.trim()) || null,
                            bio: ((_0 = payload.bio) === null || _0 === void 0 ? void 0 : _0.trim()) || null,
                            approval_status: approvalStatus,
                            is_visible: providerVisible,
                        })];
                case 11:
                    providerProfileError = (_9.sent()).error;
                    if (!providerProfileError) return [3 /*break*/, 13];
                    return [4 /*yield*/, adminClient.auth.admin.deleteUser(userId)];
                case 12:
                    _9.sent();
                    return [2 /*return*/, json({ error: providerProfileError.message || "Unable to create provider profile." }, { status: 500 }, origin)];
                case 13:
                    if (!(((_1 = payload.serviceType) === null || _1 === void 0 ? void 0 : _1.trim()) ||
                        ((_2 = payload.yearsExperience) === null || _2 === void 0 ? void 0 : _2.trim()) ||
                        typeof payload.hourlyRate === "number" ||
                        typeof payload.dailyRate === "number")) return [3 /*break*/, 16];
                    return [4 /*yield*/, adminClient.from("provider_services").upsert({
                            provider_id: userId,
                            service_type: ((_3 = payload.serviceType) === null || _3 === void 0 ? void 0 : _3.trim()) || null,
                            years_experience: ((_4 = payload.yearsExperience) === null || _4 === void 0 ? void 0 : _4.trim()) || null,
                            hourly_rate: typeof payload.hourlyRate === "number" && Number.isFinite(payload.hourlyRate)
                                ? payload.hourlyRate
                                : null,
                            daily_rate: typeof payload.dailyRate === "number" && Number.isFinite(payload.dailyRate)
                                ? payload.dailyRate
                                : null,
                        })];
                case 14:
                    serviceError = (_9.sent()).error;
                    if (!serviceError) return [3 /*break*/, 16];
                    return [4 /*yield*/, adminClient.auth.admin.deleteUser(userId)];
                case 15:
                    _9.sent();
                    return [2 /*return*/, json({ error: serviceError.message || "Unable to create provider service." }, { status: 500 }, origin)];
                case 16: return [4 /*yield*/, adminClient.from("provider_verifications").upsert({
                        provider_id: userId,
                        phone_verified: Boolean(payload.phoneVerified),
                        email_verified: Boolean(payload.emailVerified),
                        identity_verified: Boolean(payload.identityVerified),
                        kyc_verified: Boolean(payload.kycVerified),
                        background_check_verified: Boolean(payload.backgroundCheckVerified),
                        requested_documents: [],
                        admin_note: "",
                    })];
                case 17:
                    verificationError = (_9.sent()).error;
                    if (!verificationError) return [3 /*break*/, 19];
                    return [4 /*yield*/, adminClient.auth.admin.deleteUser(userId)];
                case 18:
                    _9.sent();
                    return [2 /*return*/, json({ error: verificationError.message || "Unable to create provider verification." }, { status: 500 }, origin)];
                case 19: return [4 /*yield*/, adminClient.from("provider_admin_metadata").upsert({
                        provider_id: userId,
                        availability_days: ((_5 = payload.availabilityDays) !== null && _5 !== void 0 ? _5 : []).map(function (value) { return value.trim(); }).filter(Boolean),
                        availability_time_preset: ((_6 = payload.availabilityPreset) === null || _6 === void 0 ? void 0 : _6.trim()) || null,
                        availability_start_time: ((_7 = payload.availabilityStartTime) === null || _7 === void 0 ? void 0 : _7.trim()) || null,
                        availability_end_time: ((_8 = payload.availabilityEndTime) === null || _8 === void 0 ? void 0 : _8.trim()) || null,
                    })];
                case 20:
                    metadataError = (_9.sent()).error;
                    if (!metadataError) return [3 /*break*/, 22];
                    return [4 /*yield*/, adminClient.auth.admin.deleteUser(userId)];
                case 21:
                    _9.sent();
                    return [2 /*return*/, json({ error: metadataError.message || "Unable to create provider availability." }, { status: 500 }, origin)];
                case 22: return [2 /*return*/, json({ success: true, userId: userId }, { status: 201 }, origin)];
            }
        });
    });
}
export default {
    fetch: function (request, env) {
        return __awaiter(this, void 0, void 0, function () {
            var url, assetResponse, acceptsHtml, isAssetRequest, indexRequest;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        url = new URL(request.url);
                        if (url.pathname === "/api/admin/providers/verification") {
                            return [2 /*return*/, handleProviderVerification(request, env)];
                        }
                        if (url.pathname === "/api/admin/payments/settlement") {
                            return [2 /*return*/, handlePaymentSettlement(request, env)];
                        }
                        if (url.pathname === "/api/admin/accounts/create") {
                            return [2 /*return*/, handleAccountCreate(request, env)];
                        }
                        return [4 /*yield*/, env.ASSETS.fetch(request)];
                    case 1:
                        assetResponse = _c.sent();
                        acceptsHtml = (_b = (_a = request.headers.get("accept")) === null || _a === void 0 ? void 0 : _a.includes("text/html")) !== null && _b !== void 0 ? _b : false;
                        isAssetRequest = url.pathname.startsWith("/assets/") ||
                            url.pathname.startsWith("/favicon") ||
                            /\.[a-z0-9]+$/i.test(url.pathname);
                        if (request.method === "GET" &&
                            assetResponse.status === 404 &&
                            acceptsHtml &&
                            !isAssetRequest &&
                            !url.pathname.startsWith("/api/")) {
                            indexRequest = new Request(new URL("/index.html", url.origin), request);
                            return [2 /*return*/, env.ASSETS.fetch(indexRequest)];
                        }
                        return [2 /*return*/, assetResponse];
                }
            });
        });
    },
};
