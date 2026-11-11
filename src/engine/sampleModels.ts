/**
 * Preloaded Rational Rose UML 2.5 Architecture Projects & Templates
 */

import { UMLProject } from '../types/uml';

export const SAMPLE_PROJECT_ECOMMERCE: UMLProject = {
  id: 'proj_ecommerce_ddd',
  name: 'E-Commerce Domain Architecture (UML 2.5)',
  description: 'Enterprise DDD domain model featuring aggregate roots, value objects, payment strategies, and repository interfaces in TypeScript.',
  version: '2.5.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  codeGenConfig: {
    target: 'ES2022',
    moduleSystem: 'ESM',
    useDecorators: true,
    generateGettersSetters: true,
    generateConstructors: true,
    generateJSDoc: true,
    strictNullChecks: true,
    generateIndexBarrel: true,
    filePerClass: true,
    indentSpaces: 2
  },
  packages: [
    { id: 'pkg_domain', name: 'Domain Models' },
    { id: 'pkg_services', name: 'Domain Services' },
    { id: 'pkg_payments', name: 'Payment Infrastructure' }
  ],
  diagrams: [
    {
      id: 'diag_main_class',
      name: 'Order & Payment Class Diagram',
      type: 'class_diagram',
      description: 'Core order processing and payment strategy architecture',
      elementIds: ['el_order', 'el_order_item', 'el_order_status', 'el_payment_proc', 'el_stripe_proc', 'el_paypal_proc', 'el_order_repo', 'el_money'],
      relationshipIds: ['rel_order_items', 'rel_order_status', 'rel_order_total', 'rel_stripe_impl', 'rel_paypal_impl', 'rel_order_payment'],
      zoom: 1,
      panX: 60,
      panY: 40
    }
  ],
  activeDiagramId: 'diag_main_class',
  elements: [
    {
      id: 'el_order_status',
      name: 'OrderStatus',
      type: 'enum',
      stereotype: 'enum',
      docComment: 'Lifecycle state of an order aggregate',
      attributes: [],
      operations: [],
      enumLiterals: [
        { id: 'en_pending', name: 'PENDING', value: 'PENDING', docComment: 'Order placed, awaiting checkout' },
        { id: 'en_paid', name: 'PAID', value: 'PAID', docComment: 'Payment settled successfully' },
        { id: 'en_shipped', name: 'SHIPPED', value: 'SHIPPED', docComment: 'Dispatched via carrier' },
        { id: 'en_delivered', name: 'DELIVERED', value: 'DELIVERED' },
        { id: 'en_cancelled', name: 'CANCELLED', value: 'CANCELLED' }
      ],
      x: 70,
      y: 80,
      width: 200,
      height: 190,
      colorTheme: 'amber'
    },
    {
      id: 'el_money',
      name: 'Money',
      type: 'class',
      stereotype: 'value-object',
      docComment: 'Immutable monetary value object preventing float inaccuracies',
      attributes: [
        { id: 'attr_amount', name: 'amount', type: 'number', visibility: 'public', isReadonly: true, docComment: 'Cents / smallest currency unit' },
        { id: 'attr_currency', name: 'currency', type: 'string', visibility: 'public', isReadonly: true, defaultValue: '"USD"' }
      ],
      operations: [
        {
          id: 'op_add',
          name: 'add',
          returnType: 'Money',
          visibility: 'public',
          parameters: [{ id: 'p_other', name: 'other', type: 'Money' }],
          docComment: 'Returns a new Money instance'
        },
        {
          id: 'op_format',
          name: 'format',
          returnType: 'string',
          visibility: 'public',
          parameters: []
        }
      ],
      x: 70,
      y: 320,
      width: 220,
      height: 200,
      colorTheme: 'emerald'
    },
    {
      id: 'el_order_item',
      name: 'OrderItem',
      type: 'class',
      stereotype: 'entity',
      docComment: 'Line item associated with an order entity',
      attributes: [
        { id: 'attr_item_id', name: 'productId', type: 'string', visibility: 'private' },
        { id: 'attr_name', name: 'productName', type: 'string', visibility: 'public' },
        { id: 'attr_price', name: 'unitPrice', type: 'Money', visibility: 'public' },
        { id: 'attr_qty', name: 'quantity', type: 'number', visibility: 'public', defaultValue: '1' }
      ],
      operations: [
        {
          id: 'op_get_subtotal',
          name: 'calculateSubtotal',
          returnType: 'Money',
          visibility: 'public',
          parameters: [],
          docComment: 'Computes line item total price'
        }
      ],
      x: 370,
      y: 80,
      width: 240,
      height: 220,
      colorTheme: 'blue'
    },
    {
      id: 'el_order',
      name: 'Order',
      type: 'class',
      stereotype: 'aggregate-root',
      decorators: ['@Entity("orders")'],
      docComment: 'Order Aggregate Root responsible for domain transaction consistency',
      attributes: [
        { id: 'attr_id', name: 'id', type: 'string', visibility: 'public', isReadonly: true },
        { id: 'attr_customer', name: 'customerId', type: 'string', visibility: 'public' },
        { id: 'attr_status', name: 'status', type: 'OrderStatus', visibility: 'public', defaultValue: 'OrderStatus.PENDING' },
        { id: 'attr_created', name: 'createdAt', type: 'Date', visibility: 'public' }
      ],
      operations: [
        {
          id: 'op_add_item',
          name: 'addItem',
          returnType: 'void',
          visibility: 'public',
          parameters: [
            { id: 'p_item', name: 'item', type: 'OrderItem' }
          ],
          docComment: 'Appends item and triggers order total recalculation'
        },
        {
          id: 'op_checkout',
          name: 'checkout',
          returnType: 'Promise<boolean>',
          visibility: 'public',
          isAsync: true,
          parameters: [
            { id: 'p_proc', name: 'processor', type: 'IPaymentProcessor' }
          ],
          docComment: 'Executes payment strategy and transitions status to PAID'
        },
        {
          id: 'op_total',
          name: 'calculateTotal',
          returnType: 'Money',
          visibility: 'public',
          parameters: []
        }
      ],
      x: 370,
      y: 350,
      width: 270,
      height: 280,
      colorTheme: 'indigo'
    },
    {
      id: 'el_payment_proc',
      name: 'IPaymentProcessor',
      type: 'interface',
      stereotype: 'interface',
      docComment: 'Strategy pattern abstraction for pluggable payment providers',
      attributes: [
        { id: 'attr_name_p', name: 'providerName', type: 'string', visibility: 'public', isReadonly: true }
      ],
      operations: [
        {
          id: 'op_process_pay',
          name: 'processPayment',
          returnType: 'Promise<string>',
          visibility: 'public',
          parameters: [
            { id: 'p_amt', name: 'amount', type: 'Money' },
            { id: 'p_order_id', name: 'orderId', type: 'string' }
          ],
          docComment: 'Authorizes and captures payment, returning transaction ID'
        },
        {
          id: 'op_refund',
          name: 'refund',
          returnType: 'Promise<boolean>',
          visibility: 'public',
          parameters: [
            { id: 'p_txn', name: 'transactionId', type: 'string' }
          ]
        }
      ],
      x: 720,
      y: 80,
      width: 260,
      height: 210,
      colorTheme: 'purple'
    },
    {
      id: 'el_stripe_proc',
      name: 'StripePaymentProcessor',
      type: 'class',
      stereotype: 'service',
      decorators: ['@Injectable()'],
      docComment: 'Concrete Stripe SDK implementation of payment strategy',
      attributes: [
        { id: 'attr_stripe_key', name: 'apiKey', type: 'string', visibility: 'private' },
        { id: 'attr_stripe_client', name: 'client', type: 'any', visibility: 'private' }
      ],
      operations: [
        {
          id: 'op_str_proc',
          name: 'processPayment',
          returnType: 'Promise<string>',
          visibility: 'public',
          isAsync: true,
          parameters: [
            { id: 'p_amt2', name: 'amount', type: 'Money' },
            { id: 'p_oid2', name: 'orderId', type: 'string' }
          ]
        },
        {
          id: 'op_str_ref',
          name: 'refund',
          returnType: 'Promise<boolean>',
          visibility: 'public',
          isAsync: true,
          parameters: [
            { id: 'p_txn2', name: 'transactionId', type: 'string' }
          ]
        }
      ],
      x: 700,
      y: 360,
      width: 250,
      height: 230,
      colorTheme: 'cyan'
    },
    {
      id: 'el_paypal_proc',
      name: 'PayPalPaymentProcessor',
      type: 'class',
      stereotype: 'service',
      docComment: 'PayPal gateway adapter implementation',
      attributes: [
        { id: 'attr_pp_env', name: 'environment', type: '"sandbox" | "live"', visibility: 'private' }
      ],
      operations: [
        {
          id: 'op_pp_proc',
          name: 'processPayment',
          returnType: 'Promise<string>',
          visibility: 'public',
          isAsync: true,
          parameters: [
            { id: 'p_amt3', name: 'amount', type: 'Money' },
            { id: 'p_oid3', name: 'orderId', type: 'string' }
          ]
        },
        {
          id: 'op_pp_ref',
          name: 'refund',
          returnType: 'Promise<boolean>',
          visibility: 'public',
          isAsync: true,
          parameters: [
            { id: 'p_txn3', name: 'transactionId', type: 'string' }
          ]
        }
      ],
      x: 990,
      y: 360,
      width: 250,
      height: 230,
      colorTheme: 'cyan'
    },
    {
      id: 'el_order_repo',
      name: 'IOrderRepository',
      type: 'interface',
      stereotype: 'repository',
      docComment: 'Repository boundary for persistence decoupling',
      attributes: [],
      operations: [
        {
          id: 'op_find_by_id',
          name: 'findById',
          returnType: 'Promise<Order | null>',
          visibility: 'public',
          parameters: [{ id: 'p_id', name: 'id', type: 'string' }]
        },
        {
          id: 'op_save',
          name: 'save',
          returnType: 'Promise<void>',
          visibility: 'public',
          parameters: [{ id: 'p_ord', name: 'order', type: 'Order' }]
        }
      ],
      x: 70,
      y: 560,
      width: 250,
      height: 170,
      colorTheme: 'rose'
    }
  ],
  relationships: [
    {
      id: 'rel_order_items',
      type: 'composition',
      sourceId: 'el_order',
      targetId: 'el_order_item',
      name: 'contains',
      sourceMultiplicity: '1',
      targetMultiplicity: '1..*',
      targetRole: 'items',
      docComment: 'Order owns lifecycle of line items'
    },
    {
      id: 'rel_order_status',
      type: 'dependency',
      sourceId: 'el_order',
      targetId: 'el_order_status',
      stereotype: '<<use>>',
      docComment: 'Tracks status'
    },
    {
      id: 'rel_order_total',
      type: 'dependency',
      sourceId: 'el_order',
      targetId: 'el_money',
      stereotype: '<<use>>'
    },
    {
      id: 'rel_stripe_impl',
      type: 'realization',
      sourceId: 'el_stripe_proc',
      targetId: 'el_payment_proc',
      docComment: 'implements IPaymentProcessor'
    },
    {
      id: 'rel_paypal_impl',
      type: 'realization',
      sourceId: 'el_paypal_proc',
      targetId: 'el_payment_proc',
      docComment: 'implements IPaymentProcessor'
    },
    {
      id: 'rel_order_payment',
      type: 'dependency',
      sourceId: 'el_order',
      targetId: 'el_payment_proc',
      stereotype: '<<delegates to>>'
    }
  ]
};

export const SAMPLE_PROJECT_GOF_PATTERNS: UMLProject = {
  id: 'proj_gof_patterns',
  name: 'GoF Design Patterns Suite',
  description: 'Classic Gang of Four design patterns in TypeScript (Observer, Strategy, Factory, Decorator).',
  version: '2.5.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  codeGenConfig: {
    target: 'ES2022',
    moduleSystem: 'ESM',
    useDecorators: false,
    generateGettersSetters: false,
    generateConstructors: true,
    generateJSDoc: true,
    strictNullChecks: true,
    generateIndexBarrel: true,
    filePerClass: true,
    indentSpaces: 2
  },
  packages: [
    { id: 'pkg_observer', name: 'Observer Pattern' }
  ],
  diagrams: [
    {
      id: 'diag_observer',
      name: 'Observer Pattern Class Diagram',
      type: 'class_diagram',
      elementIds: ['el_iobservable', 'el_iobserver', 'el_concrete_subject', 'el_concrete_observer_a', 'el_event_payload'],
      relationshipIds: ['rel_obs_impl_subj', 'rel_obs_impl_obs', 'rel_subj_has_obs', 'rel_subj_event'],
      zoom: 1,
      panX: 80,
      panY: 60
    }
  ],
  activeDiagramId: 'diag_observer',
  elements: [
    {
      id: 'el_event_payload',
      name: 'EventPayload',
      type: 'typeAlias',
      typeDefinition: '{ eventName: string; timestamp: number; data: any }',
      docComment: 'Type contract for dispatched notifications',
      attributes: [],
      operations: [],
      x: 80,
      y: 80,
      width: 240,
      height: 120,
      colorTheme: 'amber'
    },
    {
      id: 'el_iobserver',
      name: 'IObserver',
      type: 'interface',
      stereotype: 'interface',
      typeParameters: 'T = any',
      docComment: 'Observer interface defining update hook',
      attributes: [],
      operations: [
        {
          id: 'op_update',
          name: 'update',
          returnType: 'void',
          visibility: 'public',
          parameters: [{ id: 'p_data', name: 'eventData', type: 'T' }]
        }
      ],
      x: 420,
      y: 80,
      width: 240,
      height: 140,
      colorTheme: 'purple'
    },
    {
      id: 'el_iobservable',
      name: 'ISubject',
      type: 'interface',
      stereotype: 'interface',
      typeParameters: 'T = any',
      docComment: 'Subject interface for managing subscribers',
      attributes: [],
      operations: [
        {
          id: 'op_attach',
          name: 'attach',
          returnType: 'void',
          visibility: 'public',
          parameters: [{ id: 'p_obs', name: 'observer', type: 'IObserver<T>' }]
        },
        {
          id: 'op_detach',
          name: 'detach',
          returnType: 'void',
          visibility: 'public',
          parameters: [{ id: 'p_obs2', name: 'observer', type: 'IObserver<T>' }]
        },
        {
          id: 'op_notify',
          name: 'notify',
          returnType: 'void',
          visibility: 'public',
          parameters: [{ id: 'p_evt', name: 'data', type: 'T' }]
        }
      ],
      x: 740,
      y: 80,
      width: 260,
      height: 190,
      colorTheme: 'purple'
    },
    {
      id: 'el_concrete_subject',
      name: 'EventEmitterSubject',
      type: 'class',
      typeParameters: 'T = any',
      docComment: 'Concrete Subject maintaining observer collection',
      attributes: [
        { id: 'attr_obs_list', name: 'observers', type: 'IObserver<T>[]', visibility: 'private', defaultValue: '[]' }
      ],
      operations: [
        {
          id: 'op_cs_attach',
          name: 'attach',
          returnType: 'void',
          visibility: 'public',
          parameters: [{ id: 'p_cobs', name: 'observer', type: 'IObserver<T>' }]
        },
        {
          id: 'op_cs_detach',
          name: 'detach',
          returnType: 'void',
          visibility: 'public',
          parameters: [{ id: 'p_cobs2', name: 'observer', type: 'IObserver<T>' }]
        },
        {
          id: 'op_cs_notify',
          name: 'notify',
          returnType: 'void',
          visibility: 'public',
          parameters: [{ id: 'p_cevt', name: 'data', type: 'T' }]
        }
      ],
      x: 740,
      y: 340,
      width: 270,
      height: 230,
      colorTheme: 'indigo'
    },
    {
      id: 'el_concrete_observer_a',
      name: 'ConsoleLoggerObserver',
      type: 'class',
      docComment: 'Concrete subscriber logging state changes',
      attributes: [
        { id: 'attr_prefix', name: 'loggerPrefix', type: 'string', visibility: 'private' }
      ],
      operations: [
        {
          id: 'op_clo_update',
          name: 'update',
          returnType: 'void',
          visibility: 'public',
          parameters: [{ id: 'p_data_log', name: 'eventData', type: 'EventPayload' }]
        }
      ],
      x: 420,
      y: 340,
      width: 250,
      height: 180,
      colorTheme: 'emerald'
    }
  ],
  relationships: [
    {
      id: 'rel_obs_impl_subj',
      type: 'realization',
      sourceId: 'el_concrete_subject',
      targetId: 'el_iobservable'
    },
    {
      id: 'rel_obs_impl_obs',
      type: 'realization',
      sourceId: 'el_concrete_observer_a',
      targetId: 'el_iobserver'
    },
    {
      id: 'rel_subj_has_obs',
      type: 'aggregation',
      sourceId: 'el_concrete_subject',
      targetId: 'el_iobserver',
      targetRole: 'observers',
      targetMultiplicity: '*'
    },
    {
      id: 'rel_subj_event',
      type: 'dependency',
      sourceId: 'el_concrete_observer_a',
      targetId: 'el_event_payload',
      stereotype: '<<consumes>>'
    }
  ]
};

export const SAMPLE_MODELS: UMLProject[] = [
  SAMPLE_PROJECT_ECOMMERCE,
  SAMPLE_PROJECT_GOF_PATTERNS
];

