import * as crypto from 'crypto'

class Transaction {
  constructor(
    public amount: number,
    public payer: string, // public key
    public payee: string, // public key
  ) {}

  toString() {
    return JSON.stringify(this)
  }
}

class Block {
  constructor(
    public prevHash: string,
    public transaction: Transaction,
    public ts = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this)
    const hash = crypto.createHash('SHA256')
    hash.update(str).end()

    return hash.digest('hex')
  }
}

class Chain {
  public static instance = new Chain()

  chain: Block[]

  constructor() {
    this.chain = [new Block(null, new Transaction(100, 'genesis', 'satoshi'))]
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1]
  }

  addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    const verifier = crypto.createVerify('SHA256')
    verifier.update(transaction.toString())

    const isValid = verifier.verify(senderPublicKey, signature)

    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, transaction)
      this.mine(newBlock.nonce)
      this.chain.push(newBlock)
    }
    
  }
}

class Wallet {
  public publickKey: string // for sending money
  public privateKey: string // for receiving money

  constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })

    this.privateKey = keypair.privateKey
    this.publickKey = keypair.publicKey
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publickKey, payeePublicKey)

    const sign = crypto.createSign('SHA256')
    sign.update(transaction.toString()).end()

    const signature = sign.sign(this.privateKey)

    Chain.instance.addBlock(transaction, this.publickKey, signature)
  }
}
