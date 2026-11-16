# Graph Report - ridmo  (2026-11-16)

## Corpus Check
- 353 files · ~105,312 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .woff2 2, .example 1, (none) 1)

## Summary
- 1568 nodes · 4152 edges · 108 communities (74 shown, 34 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Rate Limiting & User Orders
- Product Detail View
- File & Image Controllers
- Admin Create/Edit Tests
- Shipping Step & Location Picker
- Checkout Flow
- Runtime Dependencies
- International Shipping
- Admin Collection Actions
- Dev Dependencies
- NextAuth Config
- Image Upload
- Cart Hook
- Base Datasource
- Price & Cart Items
- UI Package Deps
- Catalog Breadcrumb & UI Utils
- Auth Form Fields
- Admin Collection Pages
- Push Subscriptions
- Order Status Updates
- Admin Orders Pages
- Sign-In Page
- Email & Password Policy
- Datasource Tests
- User Role Management
- Admin Users Page
- Edit Modals
- Product Grid
- New-Order Push Payload
- Collection Controller
- Authorization Errors
- Collections API Routes
- Item Controller
- Location Picker
- TypeScript Config
- shadcn Components Config
- Register Action
- Sign-In Action
- Docker Compose Dev
- Collection Form
- Bank Transfer Confirmation
- Place Order Service
- Callback URL Guard
- Base & Image Controller
- Base Controller
- Create Order Action
- Order Detail & Table
- User Menu & Nav
- Collection Page
- Collection Hero & Catalog
- Order Page
- Home Page
- Collection Previews Cache
- Prisma Scripts
- Image Controller
- Order Summary
- Product Page
- Order Pricing
- Root Layout
- Collection Controller Tests
- Select Field
- VAPID Notifications
- NPM Scripts
- Seed Script
- Cart Page
- Next & Tailwind Config
- Item Create Page
- Item Controller Tests
- Order Detail Types
- Service Worker
- Prisma Client
- NextAuth Types
- Collection ID Route
- Profile Page
- Test Setup
- Order Sequence
- Theme Provider
- Next Cache Wrappers
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106

## God Nodes (most connected - your core abstractions)
1. `vitest` - 140 edges
2. `cn()` - 73 edges
3. `next` - 67 edges
4. `requireAdmin()` - 55 edges
5. `@testing-library/react` - 54 edges
6. `react` - 47 edges
7. `server-only` - 33 edges
8. `Button()` - 32 edges
9. `@testing-library/user-event` - 27 edges
10. `lucide-react` - 25 edges

## Surprising Connections (you probably didn't know these)
- `proxy` --calls--> `decideRouteAccess()`  [EXTRACTED]
  proxy.ts → modules/users/domain/route-guard.ts
- `generateMetadata()` --calls--> `buildProductMetadata()`  [EXTRACTED]
  app/[collectionSlug]/[productSlug]/page.tsx → modules/catalog/utils/product-metadata.ts
- `ProductPage()` --calls--> `ProductDetailView()`  [EXTRACTED]
  app/[collectionSlug]/[productSlug]/page.tsx → modules/catalog/components/product-detail/product-detail-view.tsx
- `CollectionPage()` --calls--> `CatalogBreadcrumb()`  [EXTRACTED]
  app/[collectionSlug]/page.tsx → modules/catalog/components/catalog-breadcrumb.tsx
- `CollectionPage()` --calls--> `ProductsGrid()`  [EXTRACTED]
  app/[collectionSlug]/page.tsx → modules/catalog/components/home-grid/products-grid.tsx

## Import Cycles
- None detected.

## Communities (108 total, 34 thin omitted)

### Community 0 - "Rate Limiting & User Orders"
Cohesion: 0.06
Nodes (49): checkLimit(), isLocked(), LimitDecision, LimiterState, LimitPolicy, LOGIN_EMAIL_POLICY, LOGIN_IP_POLICY, RateScope (+41 more)

### Community 1 - "Product Detail View"
Cohesion: 0.06
Nodes (38): ProductBuyBox(), ProductBuyBoxProps, ProductDescription(), ProductDescriptionProps, ProductDetailView(), ProductDetailViewProps, ProductServices(), ProductSummary() (+30 more)

### Community 2 - "File & Image Controllers"
Cohesion: 0.07
Nodes (24): FileController, controller, datasource, CloudinaryListOptions, CloudinaryResource, CloudinaryService, CloudinaryUploadOptions, cloudinaryMock (+16 more)

### Community 3 - "Admin Create/Edit Tests"
Cohesion: 0.08
Nodes (21): fillAndSubmit(), collections, collection, item, openAndPickImage(), Props, setup(), AddToCartButton() (+13 more)

### Community 4 - "Shipping Step & Location Picker"
Cohesion: 0.09
Nodes (28): LocationPicker, ShippingStep(), Harness(), HarnessProps, mapDefaults, mapWithPin, PIN, valid (+20 more)

### Community 5 - "Checkout Flow"
Cohesion: 0.13
Nodes (27): CheckoutFlow(), CheckoutFlowProps, EMPTY_BANK, StepNotice, CheckoutStepper(), CheckoutStepperProps, STEP_LABELS, EmptyCart() (+19 more)

### Community 6 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, @hookform/resolvers@^3.10.0, input-otp@1.4.1, lucide-react@^0.454.0, next@16.0.10, @node-rs/argon2@2.2.2 (+26 more)

### Community 7 - "International Shipping"
Cohesion: 0.15
Nodes (24): InternationalShippingNotice(), Props, CITY_RATE_GROUPS, CITY_SHIPPING_OPTIONS, CityEntry, getShippingRateRows(), INTERIOR_SHIPPING_OPTIONS, INTERNATIONAL_SHIPPING_ETA (+16 more)

### Community 8 - "Admin Collection Actions"
Cohesion: 0.14
Nodes (22): CreateCollectionPage(), getHandler(), UploadHandler, ACTIONS, controllers, denied, collections, files (+14 more)

### Community 9 - "Dev Dependencies"
Cohesion: 0.07
Nodes (30): devDependencies, jsdom@^31.0.0, postcss@^8.5, @tailwindcss/postcss@^4.1.9, @testing-library/dom@^10.4.2, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.10, tw-animate-css@1.3.3 (+22 more)

### Community 10 - "NextAuth Config"
Cohesion: 0.12
Nodes (19): authConfig, loadConfig(), handlers, signOut, TooManyAttemptsError, toRole(), applyUserToToken(), buildSession() (+11 more)

### Community 11 - "Image Upload"
Cohesion: 0.14
Nodes (20): ImageUpload, ImageUploadComponent(), ImageUploadComponentProps, Harness(), defaultValues, ItemForm(), ItemFormMode, ItemFormProps (+12 more)

### Community 12 - "Cart Hook"
Cohesion: 0.12
Nodes (15): readCart(), renderLoadedCart(), useCart(), writeCart(), AddToCartProduct, CartItem, bank, cartStub (+7 more)

### Community 13 - "Base Datasource"
Cohesion: 0.10
Nodes (9): BaseDatasource, PaginatedResult, PaginationOptions, QueryOptions, CollectionCreateData, CollectionUpdateData, ItemCreateData, ItemFilters (+1 more)

### Community 14 - "Price & Cart Items"
Cohesion: 0.14
Nodes (18): Price(), PriceProps, CartItemsStep(), CartItemsStepProps, PaymentStep(), PaymentStepProps, RecapRow(), ADDRESS_ONLY_FIELDS (+10 more)

### Community 15 - "UI Package Deps"
Cohesion: 0.08
Nodes (25): autoprefixer@^10.4.20, leaflet@1.9.4, @radix-ui/react-avatar@1.1.2, @radix-ui/react-radio-group@1.2.2, @radix-ui/react-slider@1.2.2, @radix-ui/react-switch@1.1.2, react-dom@^19.2.3, react-leaflet@5.0.0 (+17 more)

### Community 16 - "Catalog Breadcrumb & UI Utils"
Cohesion: 0.22
Nodes (18): CatalogBreadcrumb(), CatalogBreadcrumbProps, class-variance-authority, @radix-ui/react-slot, cn(), slugify(), Badge(), badgeVariants (+10 more)

### Community 17 - "Auth Form Fields"
Cohesion: 0.14
Nodes (16): AuthField(), AuthFieldProps, CONTROL_CLASSES, LINK_CLASSES, PRIMARY_BUTTON_CLASSES, GoogleButton(), GoogleMark(), SignInFormProps (+8 more)

### Community 18 - "Admin Collection Pages"
Cohesion: 0.29
Nodes (15): AdminCollectionPage(), PageProps, CreateCollectionPageClient(), CreateCollectionPageClientProps, CreateItemPageClient(), CreateItemPageClientProps, AdminLayout(), AdminCollectionsPage() (+7 more)

### Community 19 - "Push Subscriptions"
Cohesion: 0.13
Nodes (16): savePushSubscriptionAction(), subscriptionSchema, valid, EnableNotificationsButton(), HINTS, isSupported(), Props, Status (+8 more)

### Community 20 - "Order Status Updates"
Cohesion: 0.22
Nodes (14): updateOrderStatusAction(), ACTION_LABELS, ERROR_MESSAGES, OrderStatusActions(), STATUS_STYLES, allowedTransitions(), canTransition(), isOrderStatus() (+6 more)

### Community 21 - "Admin Orders Pages"
Cohesion: 0.16
Nodes (15): AdminOrderDetailPage(), dynamic, AdminOrdersPage(), dynamic, UpdateOrderStatusResult, formatOrderNumber(), isOrderNumber(), ORDER_NUMBER_PREFIX (+7 more)

### Community 22 - "Sign-In Page"
Cohesion: 0.16
Nodes (14): first(), metadata, SearchParams, SignInPage(), renderPage(), first(), metadata, SearchParams (+6 more)

### Community 23 - "Email & Password Policy"
Cohesion: 0.16
Nodes (16): RFC-5321, EMAIL_MAX_LENGTH, emailSchema, normalizeEmail(), checkPasswordPolicy(), COMMON_PASSWORDS, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH (+8 more)

### Community 24 - "Datasource Tests"
Cohesion: 0.14
Nodes (17): datasource, model, TestDatasource, datasource, datasource, items, createModelMock(), createModels() (+9 more)

### Community 25 - "User Role Management"
Cohesion: 0.16
Nodes (15): MESSAGES, setUserRoleAction(), SetUserRoleResult, RoleControl(), RoleControlProps, isRole(), OBJECT_ID_PATTERN, Role (+7 more)

### Community 26 - "Admin Users Page"
Cohesion: 0.15
Nodes (15): AdminUsersPage(), first(), metadata, SearchParams, renderPage(), dateFormat, pageHref(), UsersTable() (+7 more)

### Community 27 - "Edit Modals"
Cohesion: 0.29
Nodes (16): Collection, EditCollectionModal(), EditCollectionModalProps, EditItemModal(), EditItemModalProps, Item, Dialog(), DialogContent() (+8 more)

### Community 28 - "Product Grid"
Cohesion: 0.16
Nodes (12): GridProductCard(), GridProductCardProps, product, ProductsGrid(), ProductsGridProps, products, ProductSummary, line() (+4 more)

### Community 29 - "New-Order Push Payload"
Cohesion: 0.17
Nodes (13): buildNewOrderPayload(), NewOrderNotificationInput, PushPayload, GONE_STATUS_CODES, sendPushToAdmins(), statusCodeOf(), payload, vapid (+5 more)

### Community 31 - "Authorization Errors"
Cohesion: 0.28
Nodes (10): auth, AuthorizationError, AuthorizationErrorCode, isAuthorizationError(), CurrentUser, getCurrentUser(), loadSessionUser(), requireUser() (+2 more)

### Community 32 - "Collections API Routes"
Cohesion: 0.17
Nodes (13): GET(), POST(), DELETE(), imageController, POST(), DELETE(), GET(), itemController (+5 more)

### Community 34 - "Location Picker"
Cohesion: 0.20
Nodes (13): ClickToMark(), LocationPicker(), LocationPickerProps, PIN_ICON, toLocation(), MapLocationLink(), Props, buildMapLocationUrl() (+5 more)

### Community 35 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 36 - "shadcn Components Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 37 - "Register Action"
Cohesion: 0.18
Nodes (11): registerAction(), RegisterActionResult, input, signInMock, getClientIp(), HeaderReader, CredentialsSignInOutcome, signInWithCredentials() (+3 more)

### Community 38 - "Sign-In Action"
Cohesion: 0.20
Nodes (12): googleSignInAction(), signInAction(), SignInActionResult, signInMock, valid, signIn, SignInForm(), navigate (+4 more)

### Community 39 - "Docker Compose Dev"
Cohesion: 0.12
Nodes (16): interval, retries, start_period, test, timeout, command, container_name, healthcheck (+8 more)

### Community 40 - "Collection Form"
Cohesion: 0.25
Nodes (11): CollectionForm(), CollectionFormProps, CollectionFormValues, defaultValues, noUpload, setup(), react, Controlled() (+3 more)

### Community 41 - "Bank Transfer Confirmation"
Cohesion: 0.19
Nodes (12): BankRow(), BankTransferDetailsList(), Props, bank, emptyBank, order, bank, setup() (+4 more)

### Community 42 - "Place Order Service"
Cohesion: 0.15
Nodes (9): buildStoredAddress(), isWriteConflict(), placeOrder(), PlaceOrderResult, StockConflictError, input, ORDER_CURRENCY, PlacedOrder (+1 more)

### Community 43 - "Callback URL Guard"
Cohesion: 0.18
Nodes (13): decodedForms(), hasForbiddenCharacter(), sanitizeCallbackUrl(), startsWithUnsafePrefix(), API_PREFIXES, canonicalPath(), decideRouteAccess(), matchesPrefix() (+5 more)

### Community 44 - "Base & Image Controller"
Cohesion: 0.15
Nodes (9): BaseControllerOptions, ImageUploadResponse, cloudinary, controller, createItemSchema, querySchema, updateItemSchema, zod@^3.25.67 (+1 more)

### Community 45 - "Base Controller"
Cohesion: 0.20
Nodes (3): BaseController, controller, TestController

### Community 46 - "Create Order Action"
Cohesion: 0.21
Nodes (10): createOrder(), CreateOrderFailure, CreateOrderFailureCode, CreateOrderResult, FAILURE_MESSAGES, placed, validInput, placed (+2 more)

### Community 47 - "Order Detail & Table"
Cohesion: 0.33
Nodes (9): OrderDetailView(), Section(), OrderStatusBadge(), OrdersTable(), dateFormatter, formatOrderDate(), formatOrderMoney, OrderSummary (+1 more)

### Community 48 - "User Menu & Nav"
Cohesion: 0.20
Nodes (7): initialOf(), UserMenu(), MainNav(), MainNavProps, MenuIcon(), collections, Input()

### Community 49 - "Collection Page"
Cohesion: 0.24
Nodes (9): CollectionPage(), CollectionPageProps, CollectionParams, generateMetadata(), collection, props, getCollectionBySlug(), getProductsByCollectionSlug() (+1 more)

### Community 50 - "Collection Hero & Catalog"
Cohesion: 0.25
Nodes (7): CollectionHeroProps, CollectionLink, CollectionSummary, CollectionWithProducts, ProductDetail, buildProductMetadata(), product

### Community 51 - "Order Page"
Cohesion: 0.22
Nodes (8): metadata, OrderPage(), OrderPageProps, order, OrderConfirmationView(), loadPhone(), unset, WHATSAPP_CONTACT_PHONE_NUMBER

### Community 52 - "Home Page"
Cohesion: 0.29
Nodes (11): CarouselSkeleton(), CollectionsContent(), HeroSkeleton(), HomePage(), metadata, revalidate, collection(), product() (+3 more)

### Community 53 - "Collection Previews Cache"
Cohesion: 0.24
Nodes (9): getCachedActiveCollections, FIRST_IMAGES, getCollectionItemPreviews(), getItemPreviewsByCollection(), ITEM_PREVIEW_PROJECT, ITEM_PREVIEW_PUSH, RawCollectionGroup, RawItem (+1 more)

### Community 54 - "Prisma Scripts"
Cohesion: 0.27
Nodes (8): assertSafeTarget(), hostsOf(), isLocalDatabaseUrl(), LOCAL_HOSTS, main(), MESSAGES, normalizeEmailArg(), promoteAdmin()

### Community 56 - "Order Summary"
Cohesion: 0.30
Nodes (8): articlesLabel(), OrderSummary(), OrderSummaryProps, shippingLabel(), resolveShippingDisplay(), ShippingDisplay, shippingDisplayTotal(), calculateShippingCost()

### Community 57 - "Product Page"
Cohesion: 0.35
Nodes (6): generateMetadata(), ProductPage(), ProductPageProps, product, props, getProductBySlug()

### Community 58 - "Order Pricing"
Cohesion: 0.24
Nodes (9): CatalogItem, OrderLineSnapshot, priceOrder(), PricingFailure, PricingResult, RequestedLine, roundMoney(), chain (+1 more)

### Community 59 - "Root Layout"
Cohesion: 0.29
Nodes (6): fontSans, fontSerif, RootLayout(), getActiveCollectionLinks(), getCachedActiveCollectionLinks, Footer()

### Community 60 - "Collection Controller Tests"
Cohesion: 0.20
Nodes (6): createCollectionSchema, querySchema, controller, ds, RequestInit, updateCollectionSchema

### Community 61 - "Select Field"
Cohesion: 0.27
Nodes (8): CONTROL_CLASSES, SelectField(), SelectFieldProps, SelectOption, Harness(), OPTIONS, Props, toOption()

### Community 62 - "VAPID Notifications"
Cohesion: 0.31
Nodes (6): SaveSubscriptionResult, getVapidConfig(), getVapidPublicKey(), unset, VapidConfig, server-only

### Community 63 - "NPM Scripts"
Cohesion: 0.20
Nodes (10): scripts, admin:promote, build, db:seed, dev, lint, start, test (+2 more)

### Community 64 - "Seed Script"
Cohesion: 0.29
Nodes (8): banner(), catalog, cld(), images(), isLocal, main(), POOL, prisma

### Community 65 - "Cart Page"
Cohesion: 0.36
Nodes (6): CartPage(), metadata, bank, checkoutFlow, getBankTransferDetails(), getCheckoutDefaults()

### Community 66 - "Next & Tailwind Config"
Cohesion: 0.31
Nodes (5): nextConfig, securityHeaders, tailwindcss@^4.1.9, tailwindcss, config

### Community 67 - "Item Create Page"
Cohesion: 0.32
Nodes (5): CreateItemPage(), CreateItemPageProps, collections, propsOf(), prisma

### Community 68 - "Item Controller Tests"
Cohesion: 0.25
Nodes (5): controller, ds, images, RequestInit, validItem

### Community 69 - "Order Detail Types"
Cohesion: 0.36
Nodes (5): order, toStatus(), CheckoutDefaults, OrderDetail, UserOrderSummary

### Community 70 - "Service Worker"
Cohesion: 0.29
Nodes (3): Listener, loadServiceWorker(), WindowClient

### Community 71 - "Prisma Client"
Cohesion: 0.29
Nodes (4): constructed, disconnect, globals, loadModule()

### Community 72 - "NextAuth Types"
Cohesion: 0.29
Nodes (6): AppRole, JWT, next-auth, next-auth/jwt, Session, User

### Community 73 - "Collection ID Route"
Cohesion: 0.40
Nodes (3): collectionController, PUT(), controller

### Community 74 - "Profile Page"
Cohesion: 0.53
Nodes (4): metadata, ProfilePage(), user, listOrdersForUser()

### Community 76 - "Order Sequence"
Cohesion: 0.70
Nodes (3): isDuplicateKey(), nextSequence(), readSequence()

### Community 77 - "Theme Provider"
Cohesion: 0.50
Nodes (3): next-themes@^0.4.6, next-themes, ThemeProvider()

## Knowledge Gaps
- **2 isolated node(s):** `RFC-5321`, `{ GET, POST }`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 493 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Rate Limiting & User Orders` to `Product Detail View`, `File & Image Controllers`, `Admin Create/Edit Tests`, `Shipping Step & Location Picker`, `Checkout Flow`, `International Shipping`, `Admin Collection Actions`, `Dev Dependencies`, `NextAuth Config`, `Image Upload`, `Cart Hook`, `Price & Cart Items`, `UI Package Deps`, `Catalog Breadcrumb & UI Utils`, `Auth Form Fields`, `Admin Collection Pages`, `Push Subscriptions`, `Order Status Updates`, `Admin Orders Pages`, `Sign-In Page`, `Email & Password Policy`, `Datasource Tests`, `User Role Management`, `Admin Users Page`, `Edit Modals`, `Product Grid`, `New-Order Push Payload`, `Authorization Errors`, `Collections API Routes`, `Location Picker`, `Register Action`, `Sign-In Action`, `Collection Form`, `Bank Transfer Confirmation`, `Place Order Service`, `Callback URL Guard`, `Base & Image Controller`, `Base Controller`, `Create Order Action`, `Order Detail & Table`, `User Menu & Nav`, `Collection Page`, `Collection Hero & Catalog`, `Order Page`, `Home Page`, `Collection Previews Cache`, `Prisma Scripts`, `Order Summary`, `Product Page`, `Order Pricing`, `Root Layout`, `Collection Controller Tests`, `Select Field`, `VAPID Notifications`, `Cart Page`, `Next & Tailwind Config`, `Item Create Page`, `Item Controller Tests`, `Order Detail Types`, `Service Worker`, `Prisma Client`, `Collection ID Route`, `Profile Page`, `Test Setup`, `Order Sequence`, `Theme Provider`, `Next Cache Wrappers`?**
  _High betweenness centrality (0.368) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `requireAdmin()` (e.g. with `admin-actions.auth.test.ts` and `set-user-role.action.test.ts`) actually correct?**
  _`requireAdmin()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5321`, `{ GET, POST }` to the rest of the system?**
  _2 weakly-connected nodes found - possible missing edges._
- **Should `Rate Limiting & User Orders` be split into smaller, more focused modules?**
  _Cohesion score 0.06278538812785388 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Checkout Flow` to `Product Detail View`, `Runtime Dependencies`, `NextAuth Config`, `Image Upload`, `Price & Cart Items`, `UI Package Deps`, `Catalog Breadcrumb & UI Utils`, `Auth Form Fields`, `Admin Collection Pages`, `Order Status Updates`, `Admin Orders Pages`, `Sign-In Page`, `User Role Management`, `Admin Users Page`, `Edit Modals`, `Product Grid`, `Authorization Errors`, `Collections API Routes`, `Register Action`, `Bank Transfer Confirmation`, `Base & Image Controller`, `Base Controller`, `Create Order Action`, `Order Detail & Table`, `User Menu & Nav`, `Collection Page`, `Collection Hero & Catalog`, `Order Page`, `Home Page`, `Collection Previews Cache`, `Product Page`, `Root Layout`, `Collection Controller Tests`, `Cart Page`, `Item Controller Tests`, `Collection ID Route`, `Profile Page`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Should `Product Detail View` be split into smaller, more focused modules?**
  _Cohesion score 0.061367621274108705 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Runtime Dependencies` to `NextAuth Config`, `UI Package Deps`, `Base & Image Controller`, `Theme Provider`, `Community 80`, `Community 81`, `Community 82`, `Community 83`, `Community 84`, `Community 85`, `Community 86`, `Community 87`, `Community 88`, `Community 89`, `Community 90`, `Community 91`, `Community 92`, `Community 93`, `Community 94`, `Community 95`, `Community 96`, `Community 97`, `Community 98`, `Community 99`, `Community 100`, `Community 101`, `Community 102`, `Community 103`, `Community 104`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._