package docSamples {
	public class Test1 implements ITest1, ITest2 {
		public var testProp:String;
		
		public function testMethod():String {
			return 'hello';
		}
	}
}